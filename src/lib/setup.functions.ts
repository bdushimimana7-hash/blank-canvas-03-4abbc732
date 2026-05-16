import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const input = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

export const bootstrapSuperadmin = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data }) => {
    // Only allowed if no superadmin exists yet
    const { count } = await supabaseAdmin
      .from("user_roles").select("id", { count: "exact", head: true }).eq("role", "superadmin");
    if ((count ?? 0) > 0) throw new Error("Superadmin already exists");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message || "Failed");

    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id, role: "superadmin",
    });
    if (roleErr) throw new Error(roleErr.message);
    return { success: true };
  });

export const superadminExists = createServerFn({ method: "GET" })
  .handler(async () => {
    const { count } = await supabaseAdmin
      .from("user_roles").select("id", { count: "exact", head: true }).eq("role", "superadmin");
    return { exists: (count ?? 0) > 0 };
  });
