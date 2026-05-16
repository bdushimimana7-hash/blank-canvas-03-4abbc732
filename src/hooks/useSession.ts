import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "superadmin" | "owner" | "staff" | null;

export interface SessionInfo {
  user: User | null;
  loading: boolean;
  role: AppRole;
  businessId: string | null;
  businessName: string | null;
  sector: string | null;
}

export function useSession(): SessionInfo {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFor = async (u: User | null) => {
      if (!u) {
        if (!mounted) return;
        setRole(null); setBusinessId(null); setBusinessName(null); setSector(null);
        setLoading(false); return;
      }
      // Defer to avoid deadlock with onAuthStateChange
      setTimeout(async () => {
        const { data: roles } = await supabase
          .from("user_roles").select("role").eq("user_id", u.id);
        let r: AppRole = null;
        if (roles?.some((x) => x.role === "superadmin")) r = "superadmin";
        else if (roles?.some((x) => x.role === "owner")) r = "owner";
        else if (roles?.some((x) => x.role === "staff")) r = "staff";
        if (!mounted) return;
        setRole(r);

        if (r === "owner" || r === "staff") {
          const { data: sp } = await supabase
            .from("staff_profiles")
            .select("business_id, businesses(name, sector)")
            .eq("user_id", u.id)
            .limit(1)
            .maybeSingle();
          if (!mounted) return;
          if (sp) {
            setBusinessId(sp.business_id);
            const biz = sp.businesses as { name?: string; sector?: string } | null;
            setBusinessName(biz?.name ?? null);
            setSector(biz?.sector ?? null);
          }
        }
        if (mounted) setLoading(false);
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
      setLoading(true);
      loadFor(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      loadFor(data.session?.user ?? null);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, loading, role, businessId, businessName, sector };
}
