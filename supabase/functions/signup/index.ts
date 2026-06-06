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

        // Send welcome email to owner (fire and forget — never blocks signup)
        try {
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (resendKey) {
            const from = Deno.env.get("EMAIL_FROM") ?? "Possac <onboarding@resend.dev>";
            const html = ownerWelcomeEmail({ ownerName: full_name || "there", businessName: business_name, email });
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from, to: email, subject: `Welcome to Possac, ${full_name || business_name}!`, html }),
            }).catch((e) => console.error("Owner welcome email error", e));
          }
        } catch (emailErr) {
          console.error("Email block error", emailErr);
        }

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

function ownerWelcomeEmail(opts: { ownerName: string; businessName: string; email: string }) {
  const APP_URL = "https://possac.pages.dev";
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#F7F5F0;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #DDD9D0;overflow:hidden;">
    <div style="background:#0F6E56;padding:28px 32px;">
      <div style="font-size:22px;font-weight:700;color:#fff;">Possac</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:2px;">Smart Queue Management</div>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#0E0E0C;">Welcome, ${opts.ownerName}!</h2>
      <p style="color:#7A7A72;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your Possac account for <strong>${opts.businessName}</strong> is ready. Here is how to get started quickly.
      </p>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0F6E56;color:#fff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:600;font-size:14px;margin-bottom:28px;">Open your dashboard</a>
      <div style="background:#F7F5F0;border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:600;color:#0F6E56;margin-bottom:10px;">Three things to do first</div>
        <div style="font-size:13px;color:#374151;line-height:1.8;">
          1. Download your QR code from the dashboard and place it at your entrance.<br/>
          2. Add staff members in Settings so they can help manage the queue.<br/>
          3. Open the Live Queue when you are ready to start serving customers.
        </div>
      </div>
      <p style="color:#7A7A72;font-size:13px;line-height:1.6;margin:0;">
        Questions? Reply to this email. We want Possac to work perfectly for ${opts.businessName}.
      </p>
    </div>
    <div style="border-top:1px solid #F0EDE6;padding:20px 32px;background:#FAFAF9;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">Sent to ${opts.email} because you created a Possac account.</p>
    </div>
  </div>
</body>
</html>`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}