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
    if (!authHeader) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const phoneRaw = String(body?.phone ?? "").trim();
    const message = String(body?.message ?? "").trim();
    if (!phoneRaw || phoneRaw.length > 20 || !message || message.length > 640) {
      return json({ success: false, error: "Invalid input" }, 400);
    }

    const apiKey = Deno.env.get("PINDO_API_KEY");
    const sender = Deno.env.get("PINDO_SENDER");
    if (!apiKey || !sender) {
      console.error("Pindo credentials missing");
      return json({ success: false, error: "SMS not configured" });
    }

    let phone = phoneRaw;
    if (!phone.startsWith("+")) {
      const digits = phone.replace(/\D/g, "");
      if (digits.startsWith("250")) phone = "+" + digits;
      else if (digits.startsWith("0")) phone = "+250" + digits.slice(1);
      else phone = "+250" + digits;
    }

    const res = await fetch("https://api.pindo.io/v1/sms/", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, text: message, sender }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("Pindo error", res.status, txt);
      return json({ success: false, error: `Pindo ${res.status}` });
    }
    return json({ success: true });
  } catch (e) {
    console.error("send-sms failed", e);
    return json({ success: false, error: (e as Error).message });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}