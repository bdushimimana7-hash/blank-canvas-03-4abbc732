import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sendSmsInput = z.object({
  phone: z.string().min(8).max(20),
  message: z.string().min(1).max(640),
});

export const sendSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSmsInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.PINDO_API_KEY;
    const sender = process.env.PINDO_SENDER;
    if (!apiKey || !sender) {
      console.error("Pindo credentials missing");
      return { success: false, error: "SMS not configured" };
    }
    // Normalize phone to +250...
    let phone = data.phone.trim();
    if (!phone.startsWith("+")) {
      const digits = phone.replace(/\D/g, "");
      if (digits.startsWith("250")) phone = "+" + digits;
      else if (digits.startsWith("0")) phone = "+250" + digits.slice(1);
      else phone = "+250" + digits;
    }
    try {
      const res = await fetch("https://api.pindo.io/v1/sms/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: phone, text: data.message, sender }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Pindo error", res.status, txt);
        return { success: false, error: `Pindo ${res.status}` };
      }
      return { success: true };
    } catch (e) {
      console.error("SMS request failed", e);
      return { success: false, error: "Network error" };
    }
  });
