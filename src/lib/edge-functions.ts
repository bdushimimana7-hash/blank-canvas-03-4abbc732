import { supabase } from "@/integrations/supabase/client";

async function invoke<T>(fn: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    const ctx = (error as { context?: { error?: string } }).context;
    throw new Error(ctx?.error || error.message);
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: { phone, message },
    });
    if (error) return { success: false, error: error.message };
    return (data as { success: boolean; error?: string }) ?? { success: false };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}