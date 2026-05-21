import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPERADMIN_EMAIL = "admin@possac.com";
const SUPERADMIN_PASSWORD = "Possac@2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const action = String(body?.action ?? "");
    const data = body?.data ?? {};

    switch (action) {
      case "superadmin_exists": {
        const { count } = await admin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "superadmin");
        return json({ exists: (count ?? 0) > 0 });
      }

      case "bootstrap_superadmin": {
        const { email, password } = data;
        if (!email || !password || password.length < 8) {
          return json({ error: "Invalid input" }, 400);
        }
        const { count } = await admin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "superadmin");
        if ((count ?? 0) > 0) return json({ error: "Superadmin already exists" }, 400);
        const { data: created, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
        });
        if (error || !created.user) return json({ error: error?.message ?? "Failed" }, 400);
        const { error: re } = await admin.from("user_roles").insert({
          user_id: created.user.id, role: "superadmin",
        });
        if (re) return json({ error: re.message }, 400);
        return json({ success: true });
      }

      case "ensure_seed_superadmin": {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users.find((u) => u.email?.toLowerCase() === SUPERADMIN_EMAIL);
        let userId = existing?.id;
        if (!userId) {
          const { data: created, error } = await admin.auth.admin.createUser({
            email: SUPERADMIN_EMAIL,
            password: SUPERADMIN_PASSWORD,
            email_confirm: true,
          });
          if (error || !created.user) return json({ success: false });
          userId = created.user.id;
        }
        await admin
          .from("user_roles")
          .upsert({ user_id: userId, role: "superadmin" }, { onConflict: "user_id,role" });
        return json({ success: true });
      }

      case "signup_owner": {
        const {
          full_name, business_name, sector, email, password,
          sms_template_add, sms_template_headsup, sms_template_call,
        } = data;
        if (!email || !password || password.length < 8) {
          return json({ error: "Invalid input" }, 400);
        }
        if (String(email).toLowerCase() === SUPERADMIN_EMAIL) {
          return json({ error: "This email is reserved." }, 400);
        }
        const { data: created, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { full_name },
        });
        if (error || !created.user) {
          return json({ error: error?.message ?? "Could not create account" }, 400);
        }
        const userId = created.user.id;
        const { data: biz, error: bizErr } = await admin
          .from("businesses")
          .insert({
            name: business_name,
            sector,
            owner_id: userId,
            sms_template_add,
            sms_template_headsup,
            sms_template_call,
          })
          .select("id")
          .single();
        if (bizErr || !biz) {
          await admin.auth.admin.deleteUser(userId).catch(() => {});
          return json({ error: bizErr?.message ?? "Could not create business" }, 400);
        }
        await admin.from("staff_profiles").upsert(
          { user_id: userId, business_id: biz.id, full_name, role: "owner" },
          { onConflict: "user_id,business_id" },
        );
        await admin.from("user_roles").upsert(
          { user_id: userId, role: "owner" },
          { onConflict: "user_id,role" },
        );
        return json({ success: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("signup error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}