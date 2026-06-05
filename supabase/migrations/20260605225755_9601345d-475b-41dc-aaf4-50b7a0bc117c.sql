
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL CHECK (message_type IN ('join','headsup','call','pushback','removal','other')),
  status TEXT NOT NULL CHECK (status IN ('sent','failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_logs_business_created ON public.sms_logs (business_id, created_at DESC);
CREATE INDEX idx_sms_logs_created ON public.sms_logs (created_at DESC);

GRANT SELECT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their business sms logs"
ON public.sms_logs FOR SELECT
TO authenticated
USING (public.user_owns_business(auth.uid(), business_id));

CREATE POLICY "Superadmins can read all sms logs"
ON public.sms_logs FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));
