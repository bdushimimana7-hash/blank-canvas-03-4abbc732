import { supabase } from "@/integrations/supabase/external-client";

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // Try to extract the real error message from the response body
    try {
      const ctx = error as { context?: Response | { error?: string }; message?: string };
      if (ctx.context && ctx.context instanceof Response) {
        const json = await ctx.context.json().catch(() => null);
        if (json?.error) throw new Error(json.error);
      } else if (ctx.context && typeof ctx.context === "object" && "error" in ctx.context) {
        const msg = (ctx.context as { error?: string }).error;
        if (msg) throw new Error(msg);
      }
    } catch (inner) {
      if (inner instanceof Error && inner.message !== error.message) throw inner;
    }
    throw new Error(error.message);
  }
  if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
    const msg = (data as { error?: string }).error;
    if (msg) throw new Error(msg);
  }
  return data as T;
}

export function callAdmin<T = unknown>(action: string, data: unknown = {}) {
  return invoke<T>("admin", { action, data });
}

export function callSignup<T = unknown>(action: string, data: unknown = {}) {
  return invoke<T>("signup", { action, data });
}

export async function sendSmsViaEdge(
  phone: string,
  message: string,
  opts: { businessId?: string; messageType?: "join" | "headsup" | "call" | "pushback" | "removal" | "other"; customerName?: string } = {},
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: {
        phone,
        message,
        business_id: opts.businessId,
        message_type: opts.messageType ?? "other",
        customer_name: opts.customerName,
      },
    });
    if (error) return { success: false, error: error.message };
    return (data as { success: boolean; error?: string }) ?? { success: false };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}