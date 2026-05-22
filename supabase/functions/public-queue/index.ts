import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AVG_SERVICE_MIN_FALLBACK = 10;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function formatRwandaPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/\D/g, "");
  if (/^07[2389]\d{7}$/.test(digits)) return "+250" + digits.slice(1);
  if (/^2507[2389]\d{7}$/.test(digits)) return "+" + digits;
  return null;
}

function fillTemplate(
  tpl: string,
  vars: { name: string; position: number | string; wait: number | string; business: string },
) {
  return tpl
    .replaceAll("{name}", String(vars.name))
    .replaceAll("{position}", String(vars.position))
    .replaceAll("{wait}", String(vars.wait))
    .replaceAll("{business}", vars.business);
}

async function sendPindoSms(phone: string, message: string) {
  const apiKey = Deno.env.get("PINDO_API_KEY");
  const sender = Deno.env.get("PINDO_SENDER");
  if (!apiKey || !sender) return;
  try {
    await fetch("https://api.pindo.io/v1/sms/", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, text: message, sender }),
    });
  } catch (e) {
    console.error("Pindo send failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const action = String(body?.action ?? "");
    const data = body?.data ?? {};

    if (action === "business") {
      const id = String(data?.businessId ?? "");
      if (!id) return json({ error: "Missing businessId" }, 400);
      const { data: biz, error } = await admin
        .from("businesses").select("id, name, active").eq("id", id).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!biz || !biz.active) return json({ error: "Business not found" }, 404);
      return json({ id: biz.id, name: biz.name });
    }

    if (action === "join") {
      const businessId = String(data?.businessId ?? "");
      const name = String(data?.name ?? "").trim();
      const phoneRaw = String(data?.phone ?? "").trim();
      if (!businessId || !name) return json({ error: "Name required" }, 400);
      if (name.length > 80) return json({ error: "Name too long" }, 400);

      const { data: biz } = await admin
        .from("businesses")
        .select("id, name, active, sms_template_add, sms_template_first")
        .eq("id", businessId).maybeSingle();
      if (!biz || !biz.active) return json({ error: "Business not found" }, 404);

      let phone: string | null = null;
      if (phoneRaw) {
        phone = formatRwandaPhone(phoneRaw);
        // Invalid phone is treated as no phone (silent skip per spec)
      }

      const today = new Date().toISOString().slice(0, 10);
      let queueId: string | null = null;
      const { data: existing } = await admin
        .from("queues").select("id").eq("business_id", businessId).eq("date", today)
        .order("created_at", { ascending: true }).limit(1);
      if (existing?.[0]) queueId = existing[0].id;
      else {
        const { data: created } = await admin
          .from("queues").insert({ business_id: businessId, date: today }).select("id").single();
        queueId = created?.id ?? null;
      }
      if (!queueId) return json({ error: "Could not create queue" }, 500);

      const { count } = await admin
        .from("queue_entries").select("id", { count: "exact", head: true })
        .eq("queue_id", queueId).eq("status", "waiting");
      const position = (count ?? 0) + 1;
      const wait = position * AVG_SERVICE_MIN_FALLBACK;

      const { data: entry, error: insErr } = await admin.from("queue_entries").insert({
        queue_id: queueId, business_id: businessId,
        customer_name: name, customer_phone: phone ?? "",
        position, status: "waiting", wait_minutes: wait,
      }).select("id").single();
      if (insErr || !entry) return json({ error: insErr?.message ?? "Insert failed" }, 500);

      if (phone) {
        const tpl = position === 1 ? biz.sms_template_first : biz.sms_template_add;
        if (tpl) {
          const msg = fillTemplate(tpl, { name, position, wait, business: biz.name });
          sendPindoSms(phone, msg);
        }
      }

      return json({ entryId: entry.id, position, wait });
    }

    if (action === "status") {
      const entryId = String(data?.entryId ?? "");
      if (!entryId) return json({ error: "Missing entryId" }, 400);
      const { data: entry } = await admin
        .from("queue_entries")
        .select("id, status, position, queue_id, business_id, customer_name, added_at")
        .eq("id", entryId).maybeSingle();
      if (!entry) return json({ error: "Entry not found" }, 404);

      const { data: biz } = await admin
        .from("businesses").select("name").eq("id", entry.business_id).maybeSingle();

      const { count: ahead } = await admin
        .from("queue_entries").select("id", { count: "exact", head: true })
        .eq("queue_id", entry.queue_id).eq("status", "waiting")
        .lt("position", entry.position);

      // Average service time from served entries today
      const { data: served } = await admin
        .from("queue_entries").select("added_at, served_at")
        .eq("business_id", entry.business_id).eq("status", "served")
        .not("served_at", "is", null).limit(50);
      let avgMin = AVG_SERVICE_MIN_FALLBACK;
      if (served && served.length > 0) {
        const durs = served
          .map((s) => (new Date(s.served_at as string).getTime() - new Date(s.added_at).getTime()) / 60000)
          .filter((m) => m > 0 && m < 240);
        if (durs.length) avgMin = Math.max(1, Math.round(durs.reduce((a, b) => a + b, 0) / durs.length));
      }
      const aheadCount = ahead ?? 0;
      const wait = entry.status === "waiting" ? (aheadCount + 1) * avgMin : 0;

      return json({
        entryId: entry.id, name: entry.customer_name,
        status: entry.status, position: entry.position,
        ahead: aheadCount, waitMinutes: wait,
        businessName: biz?.name ?? "",
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("public-queue error", e);
    return json({ error: (e as Error).message }, 500);
  }
});