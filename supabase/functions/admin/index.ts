import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_URL = "https://possac.pages.dev";

// Send email via Resend (Supabase's built-in SMTP or Resend if configured)
// We use the Supabase admin generateLink + a plain fetch to Resend
async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }
  const from = Deno.env.get("EMAIL_FROM") ?? "Possac <onboarding@resend.dev>";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
}

function staffWelcomeEmail(opts: {
  staffName: string;
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#F7F5F0;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #DDD9D0;overflow:hidden;">
    <div style="background:#0F6E56;padding:28px 32px;">
      <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Possac</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:2px;">Smart Queue Management</div>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#0E0E0C;">Welcome to ${opts.businessName}, ${opts.staffName}!</h2>
      <p style="color:#7A7A72;font-size:14px;line-height:1.6;margin:0 0 24px;">
        ${opts.ownerName} has added you as a staff member on Possac — the queue management system used at ${opts.businessName}.
        Here are your login details:
      </p>
      <div style="background:#F7F5F0;border:1px solid #DDD9D0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:12px;color:#7A7A72;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Your login details</div>
        <div style="margin-bottom:8px;"><span style="font-size:13px;color:#7A7A72;">Email: </span><strong style="color:#0E0E0C;">${opts.email}</strong></div>
        <div><span style="font-size:13px;color:#7A7A72;">Temporary password: </span><strong style="color:#0E0E0C;font-family:monospace;">${opts.password}</strong></div>
      </div>
      <a href="${APP_URL}/login" style="display:inline-block;background:#0F6E56;color:#fff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:600;font-size:14px;margin-bottom:24px;">
        Sign in to Possac →
      </a>
      <div style="background:#E8F5F1;border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:600;color:#0F6E56;margin-bottom:8px;">What you can do on Possac</div>
        <ul style="margin:0;padding-left:18px;color:#374151;font-size:13px;line-height:1.8;">
          <li>View the live queue for ${opts.businessName}</li>
          <li>Add customers to the queue</li>
          <li>Call customers and mark them as served</li>
          <li>See real-time queue status on any device</li>
        </ul>
      </div>
      <p style="color:#7A7A72;font-size:13px;line-height:1.6;margin:0;">
        We recommend changing your password after your first login. If you have any questions, reply to this email or ask ${opts.ownerName}.
      </p>
    </div>
    <div style="border-top:1px solid #F0EDE6;padding:20px 32px;background:#FAFAF9;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">
        This email was sent by Possac on behalf of ${opts.businessName}. 
        If you were not expecting this, please ignore it.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function ownerWelcomeEmail(opts: {
  ownerName: string;
  businessName: string;
  email: string;
}) {
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
      const { data: r } = await admin.from("user_roles").select("role")
        .eq("user_id", userId).eq("role", "superadmin").maybeSingle();
      return !!r;
    };

    switch (action) {

      case "invite_staff": {
        const { business_id, full_name, email, password } = data;
        if (!business_id || !email || !password || password.length < 8) {
          return json({ error: "Invalid input" }, 400);
        }
        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(String(email))) {
          return json({ error: "Please enter a valid email address" }, 400);
        }
        const { data: biz } = await admin
          .from("businesses").select("id, owner_id, name").eq("id", business_id).maybeSingle();
        if (!biz) return json({ error: "Business not found" }, 404);
        if (biz.owner_id !== userId && !(await isSuperadmin())) {
          return json({ error: "Forbidden" }, 403);
        }
        // Get owner name for the email
        const { data: ownerProfile } = await admin
          .from("staff_profiles").select("full_name").eq("user_id", biz.owner_id).eq("role", "owner").maybeSingle();
        const ownerName = ownerProfile?.full_name ?? "The owner";

        const { data: created, error: ce } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name },
        });
        if (ce || !created.user) return json({ error: ce?.message ?? "Failed to create account" }, 400);

        const { error: spErr } = await admin.from("staff_profiles").insert({
          user_id: created.user.id, business_id, full_name, role: "staff",
        });
        if (spErr) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: spErr.message }, 400);
        }
        await admin.from("user_roles").insert({ user_id: created.user.id, role: "staff" });

        // Send welcome email to staff member
        await sendEmail(
          email,
          `You've been added to ${biz.name} on Possac`,
          staffWelcomeEmail({
            staffName: full_name || "there",
            businessName: biz.name,
            ownerName,
            email,
            password,
          }),
        ).catch((e) => console.error("Staff email error", e));

        return json({ success: true, user_id: created.user.id });
      }

      case "remove_staff": {
        const { staff_profile_id } = data;
        if (!staff_profile_id) return json({ error: "Invalid input" }, 400);
        const { data: sp } = await admin
          .from("staff_profiles").select("id, user_id, business_id, role").eq("id", staff_profile_id).maybeSingle();
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

      case "create_business_owner": {
        if (!(await isSuperadmin())) return json({ error: "Forbidden" }, 403);
        const { business_name, sector, owner_name, owner_email, password } = data;
        if (!business_name || !owner_email || !password || password.length < 8) {
          return json({ error: "Invalid input" }, 400);
        }
        const { data: created, error: ce } = await admin.auth.admin.createUser({
          email: owner_email, password, email_confirm: true,
          user_metadata: { full_name: owner_name },
        });
        if (ce || !created.user) return json({ error: ce?.message ?? "Failed to create user" }, 400);
        const { data: biz, error: be } = await admin
          .from("businesses").insert({ name: business_name, sector, owner_id: created.user.id }).select().single();
        if (be) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: be.message }, 400);
        }
        return json({ success: true, business_id: biz.id, user_id: created.user.id });
      }

      case "set_business_active": {
        if (!(await isSuperadmin())) return json({ error: "Forbidden" }, 403);
        const { business_id, active } = data;
        const { error } = await admin.from("businesses").update({ active: !!active }).eq("id", business_id);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }

      case "list_businesses_admin": {
        if (!(await isSuperadmin())) return json({ error: "Forbidden" }, 403);
        const { data: biz } = await admin
          .from("businesses").select("id, name, sector, active, created_at, owner_id")
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
          const { count } = await admin.from("queue_entries")
            .select("id", { count: "exact", head: true })
            .eq("business_id", b.id).eq("status", "served");
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