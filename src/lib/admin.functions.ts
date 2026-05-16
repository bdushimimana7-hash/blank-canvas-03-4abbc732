import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const createOwnerInput = z.object({
  business_name: z.string().min(1).max(120),
  sector: z.string().min(1).max(40),
  owner_name: z.string().min(1).max(120),
  owner_email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

export const createBusinessOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createOwnerInput.parse(input))
  .handler(async ({ data, context }) => {
    // Verify caller is superadmin
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "superadmin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    // Create the user
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.owner_email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.owner_name },
      });
    if (createErr || !created.user) {
      throw new Error(createErr?.message || "Failed to create user");
    }

    // Create business (trigger creates staff_profile + owner role)
    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: data.business_name,
        sector: data.sector,
        owner_id: created.user.id,
      })
      .select()
      .single();
    if (bizErr) {
      // Clean up user if business insert fails
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(bizErr.message);
    }
    return { success: true, business_id: biz.id, user_id: created.user.id };
  });

const inviteStaffInput = z.object({
  business_id: z.string().uuid(),
  full_name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inviteStaffInput.parse(input))
  .handler(async ({ data, context }) => {
    // Verify caller owns the business (or is superadmin)
    const { data: biz } = await context.supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", data.business_id)
      .maybeSingle();
    if (!biz) throw new Error("Business not found");
    const { data: superRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "superadmin")
      .maybeSingle();
    if (biz.owner_id !== context.userId && !superRow) throw new Error("Forbidden");

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed");

    const { error: spErr } = await supabaseAdmin.from("staff_profiles").insert({
      user_id: created.user.id,
      business_id: data.business_id,
      full_name: data.full_name,
      role: "staff",
    });
    if (spErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(spErr.message);
    }
    await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: "staff",
    });
    return { success: true, user_id: created.user.id };
  });

const removeStaffInput = z.object({ staff_profile_id: z.string().uuid() });

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => removeStaffInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: sp } = await context.supabase
      .from("staff_profiles")
      .select("id, user_id, business_id, role")
      .eq("id", data.staff_profile_id)
      .maybeSingle();
    if (!sp) throw new Error("Not found");
    if (sp.role === "owner") throw new Error("Cannot remove owner");

    const { data: biz } = await context.supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", sp.business_id)
      .maybeSingle();
    const { data: superRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "superadmin")
      .maybeSingle();
    if (biz?.owner_id !== context.userId && !superRow) throw new Error("Forbidden");

    await supabaseAdmin.from("staff_profiles").delete().eq("id", sp.id);
    await supabaseAdmin.auth.admin.deleteUser(sp.user_id);
    return { success: true };
  });

const setBusinessActiveInput = z.object({
  business_id: z.string().uuid(),
  active: z.boolean(),
});

export const setBusinessActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setBusinessActiveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: superRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "superadmin")
      .maybeSingle();
    if (!superRow) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ active: data.active })
      .eq("id", data.business_id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
