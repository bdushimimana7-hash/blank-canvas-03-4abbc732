
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('superadmin', 'owner', 'staff');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT 'other',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sms_template_add TEXT NOT NULL DEFAULT 'Hello {name}, you are number {position} in the queue. Estimated wait: {wait} minutes.',
  sms_template_call TEXT NOT NULL DEFAULT 'Hello {name}, it is now your turn. Please come in.',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Staff profiles
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Queues (daily)
CREATE TABLE public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, date)
);
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Queue entries
CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  wait_minutes INTEGER
);
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_queue_entries_queue ON public.queue_entries(queue_id);
CREATE INDEX idx_queue_entries_business ON public.queue_entries(business_id);
CREATE INDEX idx_queues_business_date ON public.queues(business_id, date);
CREATE INDEX idx_staff_profiles_user ON public.staff_profiles(user_id);

-- Security definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin');
$$;

-- Returns business_ids the user can access (owner or staff)
CREATE OR REPLACE FUNCTION public.user_business_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.businesses WHERE owner_id = _user_id
  UNION
  SELECT business_id FROM public.staff_profiles WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_business(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_superadmin(_user_id)
    OR EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = _user_id AND business_id = _business_id);
$$;

CREATE OR REPLACE FUNCTION public.user_owns_business(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_superadmin(_user_id)
    OR EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = _user_id);
$$;

-- RLS policies

-- user_roles: only superadmin can manage; users can read their own
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));
CREATE POLICY "Superadmin manages roles" ON public.user_roles FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- businesses
CREATE POLICY "Access own business" ON public.businesses FOR SELECT
  USING (public.is_superadmin(auth.uid()) OR owner_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.business_id = businesses.id));
CREATE POLICY "Owner updates own business" ON public.businesses FOR UPDATE
  USING (public.is_superadmin(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.is_superadmin(auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "Superadmin inserts businesses" ON public.businesses FOR INSERT
  WITH CHECK (public.is_superadmin(auth.uid()));
CREATE POLICY "Superadmin deletes businesses" ON public.businesses FOR DELETE
  USING (public.is_superadmin(auth.uid()));

-- staff_profiles
CREATE POLICY "View staff for accessible business" ON public.staff_profiles FOR SELECT
  USING (public.user_can_access_business(auth.uid(), business_id));
CREATE POLICY "Owner manages staff" ON public.staff_profiles FOR INSERT
  WITH CHECK (public.user_owns_business(auth.uid(), business_id));
CREATE POLICY "Owner updates staff" ON public.staff_profiles FOR UPDATE
  USING (public.user_owns_business(auth.uid(), business_id))
  WITH CHECK (public.user_owns_business(auth.uid(), business_id));
CREATE POLICY "Owner deletes staff" ON public.staff_profiles FOR DELETE
  USING (public.user_owns_business(auth.uid(), business_id));

-- queues
CREATE POLICY "View queues for accessible business" ON public.queues FOR SELECT
  USING (public.user_can_access_business(auth.uid(), business_id));
CREATE POLICY "Insert queues for accessible business" ON public.queues FOR INSERT
  WITH CHECK (public.user_can_access_business(auth.uid(), business_id));

-- queue_entries
CREATE POLICY "View entries for accessible business" ON public.queue_entries FOR SELECT
  USING (public.user_can_access_business(auth.uid(), business_id));
CREATE POLICY "Insert entries for accessible business" ON public.queue_entries FOR INSERT
  WITH CHECK (public.user_can_access_business(auth.uid(), business_id));
CREATE POLICY "Update entries for accessible business" ON public.queue_entries FOR UPDATE
  USING (public.user_can_access_business(auth.uid(), business_id))
  WITH CHECK (public.user_can_access_business(auth.uid(), business_id));

-- Realtime
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

-- Trigger: auto-create owner staff_profile + role when business created
CREATE OR REPLACE FUNCTION public.handle_new_business()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.staff_profiles (user_id, business_id, full_name, role)
    VALUES (NEW.owner_id, NEW.id, '', 'owner')
    ON CONFLICT (user_id, business_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created
AFTER INSERT ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.handle_new_business();
