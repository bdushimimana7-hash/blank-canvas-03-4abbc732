import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { sectorCopy } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { sendSms } from "@/lib/sms.functions";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/queue/add")({
  component: AddToQueue,
  head: () => ({ meta: [{ title: "Add to queue — Possac" }] }),
});

const AVG_SERVICE_MIN = 10;

function AddToQueue() {
  const navigate = useNavigate();
  const { user, loading, role: _role, businessId, sector, businessName } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sendSmsFn = useServerFn(sendSms);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const copy = sectorCopy(sector);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error("No business assigned to your account");
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^0?7\d{8}$/.test(cleanPhone) && !/^\+?2507\d{8}$/.test(cleanPhone)) {
      toast.error("Enter a valid Rwanda phone (07XXXXXXXX)");
      return;
    }
    setSubmitting(true);

    // Get or create today's queue
    const today = new Date().toISOString().slice(0, 10);
    let queueId: string | null = null;
    const { data: existing } = await supabase
      .from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (existing) queueId = existing.id;
    else {
      const { data: created, error } = await supabase
        .from("queues").insert({ business_id: businessId, date: today }).select("id").single();
      if (error || !created) { setSubmitting(false); toast.error("Could not create queue"); return; }
      queueId = created.id;
    }

    // Compute position from waiting count
    const { count: waitingCount } = await supabase
      .from("queue_entries")
      .select("id", { count: "exact", head: true })
      .eq("queue_id", queueId)
      .eq("status", "waiting");
    const position = (waitingCount ?? 0) + 1;
    const wait = position * AVG_SERVICE_MIN;

    // Get business sms template
    const { data: biz } = await supabase
      .from("businesses").select("sms_template_add").eq("id", businessId).single();

    const { error: insErr } = await supabase.from("queue_entries").insert({
      queue_id: queueId,
      business_id: businessId,
      customer_name: name.trim(),
      customer_phone: cleanPhone,
      position,
      status: "waiting",
      added_by: user?.id ?? null,
      wait_minutes: wait,
    });
    if (insErr) { setSubmitting(false); toast.error(insErr.message); return; }

    // Fire SMS
    if (biz?.sms_template_add) {
      const message = fillTemplate(biz.sms_template_add, { name: name.trim(), position, wait, business: businessName ?? "" });
      const result = await sendSmsFn({ data: { phone: cleanPhone, message } });
      if (!result.success) toast.warning("Added, but SMS failed: " + (result.error ?? ""));
      else toast.success(`Added. SMS sent to ${cleanPhone}`);
    } else {
      toast.success("Added to queue");
    }

    setName(""); setPhone(""); setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/queue" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
            <ArrowLeft className="h-4 w-4" /> Live queue
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-muted-foreground hover:text-foreground"
          >Sign out</button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Add to queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          New {copy.customer.toLowerCase()} — they'll get an SMS confirmation.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
