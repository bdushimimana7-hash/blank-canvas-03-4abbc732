import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { sectorCopy } from "@/lib/sectors";
import { fillTemplate, formatRwandaPhone } from "@/lib/format";
import { sendSmsViaEdge } from "@/lib/edge-functions";
import { ArrowLeft } from "lucide-react";

const AVG_SERVICE_MIN = 10;

export default function AddToQueue() {
  const navigate = useNavigate();
  const { user, loading, businessId, sector, businessName } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = "Add to queue — Possac"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);

  const copy = sectorCopy(sector);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessId) { setError("No business linked to your account."); return; }
    const formatted = phone.trim() ? formatRwandaPhone(phone) : null;
    if (phone.trim() && !formatted) { setError("Please enter a valid Rwandan phone number (07XXXXXXXX)."); return; }
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      let queueId: string | null = null;
      const { data: eq } = await supabase.from("queues").select("id").eq("business_id", businessId).eq("date", today).limit(1).maybeSingle();
      if (eq) {
        queueId = eq.id;
      } else {
        const { data: cq } = await supabase.from("queues").insert({ business_id: businessId, date: today }).select("id").single();
        if (cq?.id) queueId = cq.id;
        else {
          const { data: fq } = await supabase.from("queues").select("id").eq("business_id", businessId).eq("date", today).limit(1).maybeSingle();
          queueId = fq?.id ?? null;
        }
      }
      if (!queueId) throw new Error("Could not create today's queue.");
      const { count: wc } = await supabase.from("queue_entries").select("id", { count: "exact", head: true }).eq("queue_id", queueId).eq("status", "waiting");
      const position = (wc ?? 0) + 1;
      const wait = position * AVG_SERVICE_MIN;
      const { data: biz } = await supabase.from("businesses").select("sms_template_add, sms_template_first").eq("id", businessId).maybeSingle();
      const { error: ie } = await supabase.from("queue_entries").insert({
        queue_id: queueId, business_id: businessId,
        customer_name: name.trim(), customer_phone: formatted ?? "",
        position, status: "waiting", added_by: user!.id, wait_minutes: wait,
      });
      if (ie) throw new Error("Could not add to queue: " + ie.message);
      toast.success(`${copy.customer} added`);
      const savedName = name.trim();
      setName(""); setPhone(""); setSubmitting(false);
      navigate("/queue");
      if (formatted) {
        const tpl = position === 1 && biz?.sms_template_first ? biz.sms_template_first : biz?.sms_template_add;
        if (tpl) {
          const msg = fillTemplate(tpl, { name: savedName, position, wait, business: businessName ?? "" });
          sendSmsViaEdge(formatted, msg, { businessId, messageType: "join", customerName: savedName }).then((r) => { if (!r.success) toast.warning("SMS failed to send."); }).catch(() => toast.warning("SMS failed to send."));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error.";
      setError(msg); toast.error(msg); setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/queue" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Live queue
          </Link>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-[#9CA3AF] hover:text-[#111827] transition-colors">Sign out</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold tracking-tight text-[#111827]">Add {copy.customer.toLowerCase()}</h1>
        <p className="text-sm text-[#6B7280] mt-1">They&apos;ll get an SMS confirmation if a phone number is provided.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#374151]">{copy.customer} name <span className="text-red-400">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aline Uwase"
              className="w-full border border-[#E5E7EB] rounded-xl px-4 h-12 text-[15px] bg-white outline-none focus:border-[#0F6E56] transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#374151]">Phone number <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX" inputMode="tel"
              className="w-full border border-[#E5E7EB] rounded-xl px-4 h-12 text-[15px] bg-white outline-none focus:border-[#0F6E56] transition-colors" />
            <p className="text-xs text-[#9CA3AF]">Rwanda format: 07XXXXXXXX — leave blank if customer prefers not to share</p>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-[#0F6E56] text-white rounded-full font-medium text-[15px] hover:bg-[#0D5E49] transition-colors disabled:opacity-60 mt-2 py-3.5">
            {submitting ? "Adding…" : `Add to queue`}
          </button>
        </form>
      </div>
    </div>
  );
}
