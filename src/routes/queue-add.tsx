import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { document.title = "Add to queue — Possac"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);

  const copy = sectorCopy(sector);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (loading) { setFormError("Still loading your session — please wait a moment."); return; }
    if (!user) { setFormError("You are not signed in. Please log in again."); return; }
    if (!businessId) {
      setFormError("No business is linked to your account. Contact your administrator.");
      return;
    }
    const formatted = formatRwandaPhone(phone);
    if (!formatted) { setFormError("Please enter a valid Rwandan phone number (07XXXXXXXX)."); return; }
    setSubmitting(true);

    try {
      const today = new Date().toISOString().slice(0, 10);
      let queueId: string | null = null;
      const { data: existingQueues, error: qSelErr } = await supabase
        .from("queues").select("id").eq("business_id", businessId).eq("date", today)
        .order("created_at", { ascending: true }).limit(1);
      if (qSelErr) throw new Error("Could not load today's queue: " + qSelErr.message);
      if (existingQueues?.[0]) {
        queueId = existingQueues[0].id;
      } else {
        const { data: created, error: qInsErr } = await supabase
          .from("queues").insert({ business_id: businessId, date: today }).select("id").single();
        if (created?.id) queueId = created.id;
        else {
          const { data: fb, error: fbErr } = await supabase
            .from("queues").select("id").eq("business_id", businessId).eq("date", today)
            .order("created_at", { ascending: true }).limit(1);
          if (fbErr) throw new Error("Could not create today's queue: " + fbErr.message);
          if (!fb?.[0]?.id) throw new Error("Could not create today's queue: " + (qInsErr?.message ?? "unknown"));
          queueId = fb[0].id;
        }
      }

      const { count: waitingCount } = await supabase
        .from("queue_entries").select("id", { count: "exact", head: true })
        .eq("queue_id", queueId).eq("status", "waiting");
      const position = (waitingCount ?? 0) + 1;
      const wait = position * AVG_SERVICE_MIN;

      const { data: biz } = await supabase
        .from("businesses").select("sms_template_add, sms_template_first").eq("id", businessId).maybeSingle();

      const { data: insertedEntry, error: insErr } = await supabase.from("queue_entries").insert({
        queue_id: queueId, business_id: businessId,
        customer_name: name.trim(), customer_phone: formatted,
        position, status: "waiting", added_by: user.id, wait_minutes: wait,
      }).select("id").single();
      if (insErr) throw new Error("Could not add to queue: " + insErr.message);
      if (!insertedEntry?.id) throw new Error("Could not add to queue: no record was created.");

      toast.success("Added to queue");
      const savedName = name.trim();
      setName(""); setPhone(""); setSubmitting(false);
      navigate("/queue");

      const tpl = position === 1
        ? (biz?.sms_template_first ?? null)
        : (biz?.sms_template_add ?? null);
      if (tpl) {
        const message = fillTemplate(tpl, {
          name: savedName, position, wait, business: businessName ?? "",
        });
        sendSmsViaEdge(formatted, message)
          .then((result) => {
            if (!result.success) toast.warning("Added to queue. SMS failed — check Pindo settings.");
          })
          .catch(() => toast.warning("Added to queue. SMS failed — check Pindo settings."));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error adding to queue.";
      setFormError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/queue" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
            <ArrowLeft className="h-4 w-4" /> Live queue
          </Link>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Add to queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          New {copy.customer.toLowerCase()} — they'll get an SMS confirmation.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {formError && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">{copy.customer} name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              className="h-12 text-base" placeholder="e.g. Aline Uwase" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)}
              inputMode="tel" className="h-12 text-base" placeholder="07XXXXXXXX" />
            <p className="text-xs text-muted-foreground">Rwanda format: 07XXXXXXXX</p>
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-14 text-base">
            {submitting ? "Adding…" : "Add to queue"}
          </Button>
        </form>
      </div>
    </div>
  );
}