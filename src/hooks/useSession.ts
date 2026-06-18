// src/hooks/useSession.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/external-client";
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

  // Track which user we've already loaded for, so we never double-load
  const loadingForRef = useRef<string | null>(undefined);

  useEffect(() => {
    let mounted = true;

    const loadFor = async (u: User | null) => {
      const uid = u?.id ?? null;

      // Skip if we're already loading/loaded for this exact user
      if (loadingForRef.current === uid) return;
      loadingForRef.current = uid;

      if (!u) {
        if (!mounted) return;
        setUser(null);
        setRole(null);
        setBusinessId(null);
        setBusinessName(null);
        setSector(null);
        setLoading(false);
        return;
      }

      if (mounted) {
        setUser(u);
        setLoading(true);
      }

      try {
        const { data: sp, error: profileError } = await supabase
          .from("staff_profiles")
          .select("business_id, role")
          .eq("user_id", u.id)
          .limit(1)
          .maybeSingle();

        if (profileError) {
          console.error("[useSession] Failed to load staff profile", profileError);
        }

        let resolvedRole: AppRole = null;

        if (sp?.role === "owner" || sp?.role === "staff" || sp?.role === "superadmin") {
          resolvedRole = sp.role;
        } else {
          const { data: superadmin, error: superadminError } = await supabase.rpc(
            "is_superadmin",
            { _user_id: u.id }
          );
          if (superadminError) {
            console.error("[useSession] Failed to resolve superadmin role", superadminError);
          } else if (superadmin) {
            resolvedRole = "superadmin";
          }
        }

        if (!mounted) return;
        setRole(resolvedRole);

        if (sp?.business_id) {
          setBusinessId(sp.business_id);
          const { data: biz, error: businessError } = await supabase
            .from("businesses")
            .select("name, sector")
            .eq("id", sp.business_id)
            .maybeSingle();

          if (businessError) {
            console.error("[useSession] Failed to load business", businessError);
          }

          if (!mounted) return;
          setBusinessName(biz?.name ?? null);
          setSector(biz?.sector ?? null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // onAuthStateChange is the single source of truth.
    // INITIAL_SESSION fires on mount with the current session (or null).
    // SIGNED_IN fires on login. SIGNED_OUT fires on logout.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      loadFor(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, role, businessId, businessName, sector };
}
