import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPERADMIN_EMAIL = "admin@possac.com";
const SUPERADMIN_PASSWORD = "Possac@2026!";

const signupInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  business_name: z.string().trim().min(1).max(120),
  sector: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  sms_template_add: z.string().min(1).max(640),
  sms_template_headsup: z.string().min(1).max(640),
  sms_template_call: z.string().min(1).max(640),
});

export const signupOwner = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => signupInput.parse(i))
  .handler(async ({ data }) => {
    if (data.email.toLowerCase() === SUPERADMIN_EMAIL) {
      throw new Error("This email is reserved.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message || "Could not create account");

    const userId = created.user.id;

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: data.business_name,
        sector: data.sector,
        owner_id: userId,
        sms_template_add: data.sms_template_add,
        sms_template_headsup: data.sms_template_headsup,
        sms_template_call: data.sms_template_call,
      })
      .select("id")
      .single();
    if (bizErr || !biz) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(bizErr?.message || "Could not create business");
    }

    // The handle_new_business trigger inserts staff_profile + owner role,
    // but full_name is empty — patch it.
    await supabaseAdmin
      .from("staff_profiles")
      .update({ full_name: data.full_name })
      .eq("user_id", userId)
      .eq("business_id", biz.id);

    return { success: true };
  });

// Idempotent: ensure the hardcoded superadmin exists.
export const ensureSeedSuperadmin = createServerFn({ method: "POST" })
  .handler(async () => {
    // Look up by email via listUsers (paged search)
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === SUPERADMIN_EMAIL);
    let userId = existing?.id;

    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        email_confirm: true,
      });
      if (error || !created.user) return { success: false };
      userId = created.user.id;
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "superadmin" }, { onConflict: "user_id,role" });

    return { success: true };
  });
