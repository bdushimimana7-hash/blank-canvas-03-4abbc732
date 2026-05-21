import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const action = String(body?.action ?? "");
    const data = body?.data ?? {};

    const isSuperadmin = async () => {
      const { data: r } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "superadmin")
        .maybeSingle();
      return !!r;
    };

    switch (action) {
      case "create_business_owner": {
        if (!(await isSuperadmin())) return json({ error: "Forbidden" }, 403);
        const { business_name, sector, owner_name, owner_email, password } = data;
        if (!business_name || !owner_email || !password || password.length < 8) {
          return json({ error: "Invalid input" }, 400);
        }
        const { data: created, error: ce } = await admin.auth.admin.createUser({
          email: owner_email,
          password,
          email_confirm: true,
          user_metadata: { full_name: owner_name },
        });
        if (ce || !created.user) return json({ error: ce?.message ?? "Failed to create user" }, 400);
        const { data: biz, error: be } = await admin
          .from("businesses")
          .insert({ name: business_name, sector, owner_id: created.user.id })
          .select()
          .single();
        if (be) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: be.message }, 400);
        }
        return json({ success: true, business_id: biz.id, user_id: created.user.id });
      }

      case "invite_staff": {
        const { business_id, full_name, email, password } = data;
        if (!business_id || !email || !password || password.length < 8) {
          return json({ error: "Invalid input" }, 400);
        }
        const { data: biz } = await admin
          .from("businesses").select("id, owner_id").eq("id", business_id).maybeSingle();
        if (!biz) return json({ error: "Business not found" }, 404);
        if (biz.owner_id !== userId && !(await isSuperadmin())) {
          return json({ error: "Forbidden" }, 403);
        }
        const { data: created, error: ce } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name },
        });
        if (ce || !created.user) return json({ error: ce?.message ?? "Failed" }, 400);
        const { error: spErr } = await admin.from("staff_profiles").insert({
          user_id: created.user.id, business_id, full_name, role: "staff",
        });
        if (spErr) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: spErr.message }, 400);
        }
        await admin.from("user_roles").insert({ user_id: created.user.id, role: "staff" });
        try {
          await admin.auth.admin.generateLink({ type: "recovery", email });
        } catch (e) {
          console.error("Could not send invite email", e);
        }
        return json({ success: true, user_id: created.user.id });
      }

      case "remove_staff": {
        const { staff_profile_id } = data;
        if (!staff_profile_id) return json({ error: "Invalid input" }, 400);
        const { data: sp } = await admin
          .from("staff_profiles")
          .select("id, user_id, business_id, role")
          .eq("id", staff_profile_id)
          .maybeSingle();
        if (!sp) return json({ error: "Not found" }, 404);
        if (sp.role === "owner") return json({ error: "Cannot remove owner" }, 400);
        const { data: biz } = await admin
          .from("businesses").select("owner_id").eq("id", sp.business_id).maybeSingle();
        if (biz?.owner_id !== userId && !(await isSuperadmin())) {
          return json({ error: "Forbidden" }, 403);
        }
        await admin.from("staff_profiles").delete().eq("id", sp.id);
        await admin.auth.admin.deleteUser(sp.user_id);
        return json({ success: true });
      }

      case "set_business_active": {
        if (!(await isSuperadmin())) return json({ error: "Forbidden" }, 403);
        const { business_id, active } = data;
        const { error } = await admin
          .from("businesses").update({ active: !!active }).eq("id", business_id);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }

      case "list_businesses_admin": {
        if (!(await isSuperadmin())) return json({ error: "Forbidden" }, 403);
        const { data: biz } = await admin
          .from("businesses")
          .select("id, name, sector, active, created_at, owner_id")
          .order("created_at", { ascending: false });

        const emailById = new Map<string, string>();
        let page = 1;
        while (true) {
          const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
          if (!list?.users.length) break;
          for (const u of list.users) if (u.email) emailById.set(u.id, u.email);
          if (list.users.length < 200) break;
          page += 1;
          if (page > 25) break;
        }

        const rows: Array<Record<string, unknown>> = [];
        for (const b of biz ?? []) {
          const { count } = await admin
            .from("queue_entries")
            .select("id", { count: "exact", head: true })
            .eq("business_id", b.id)
            .eq("status", "served");
          rows.push({
            id: b.id, name: b.name, sector: b.sector, active: b.active,
            created_at: b.created_at,
            owner_email: b.owner_id ? (emailById.get(b.owner_id) ?? null) : null,
            total_served: count ?? 0,
          });
        }
        return json({ businesses: rows });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}