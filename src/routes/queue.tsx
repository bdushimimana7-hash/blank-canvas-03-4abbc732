import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { sectorCopy } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { sendSmsViaEdge } from "@/lib/edge-functions";
import { Plus } from "lucide-react";

interface Entry {
  id: string;
  customer_name: string;
  customer_phone: string;
  position: number;
  status: "waiting" | "called" | "served" | "no_show";
  added_at: string;
  called_at: string | null;
  served_at: string | null;
  headsup_sent: boolean;
}

export default function LiveQueue() {
  const navigate = useNavigate();
  const { user, loading, businessId, sector, businessName } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => { document.title = "Live queue — Possac"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!businessId) return;
    const { data: q } = await supabase
      .from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (!q) { setEntries([]); return; }
    const { data } = await supabase
      .from("queue_entries").select("*").eq("queue_id", q.id).order("position");
    setEntries((data ?? []) as Entry[]);
  }, [businessId, today]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel("queue-entries-" + businessId)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: `business_id=eq.${businessId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, load]);

  const copy = sectorCopy(sector);

  const triggerHeadsupIfNeeded = async () => {
    if (!businessId) return;
    const { data: q } = await supabase
      .from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (!q) return;
    const { data: waitingList } = await supabase
      .from("queue_entries")
      .select("id, customer_name, customer_phone, headsup_sent, wait_minutes")
      .eq("queue_id", q.id)
      .eq("status", "waiting")
      .order("position");
    const { data: bizCfg } = await supabase
      .from("businesses").select("headsup_position").eq("id", businessId).maybeSingle();
    const headsupPos = Math.max(1, Math.min(5, bizCfg?.headsup_position ?? 3));
    if (!waitingList || waitingList.length < headsupPos) return;
    const third = waitingList[headsupPos - 1];
    if (third.headsup_sent) return;
    const { data: claimed } = await supabase
      .from("queue_entries")
      .update({ headsup_sent: true })
      .eq("id", third.id)
      .eq("headsup_sent", false)
      .select("id");
    if (!claimed || claimed.length === 0) return;
    const { data: biz } = await supabase
      .from("businesses").select("sms_template_headsup").eq("id", businessId).single();
    if (!biz?.sms_template_headsup) return;
    const message = fillTemplate(biz.sms_template_headsup, {
      name: third.customer_name, position: headsupPos, wait: third.wait_minutes ?? 0, business: businessName ?? "",
    });
    const r = await sendSmsViaEdge(third.customer_phone, message);
    if (!r.success) {
      await supabase.from("queue_entries").update({ headsup_sent: false }).eq("id", third.id);
    }
  };

  const callEntry = async (e: Entry) => {
    const { error } = await supabase.from("queue_entries")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", e.id);
    if (error) { toast.error("Could not update: " + error.message); return; }
    const { data: biz } = await supabase
      .from("businesses").select("sms_template_call").eq("id", businessId!).single();
    if (biz?.sms_template_call) {
      const message = fillTemplate(biz.sms_template_call, {
        name: e.customer_name, position: e.position, wait: 0, business: businessName ?? "",
      });
      toast.success(`Called ${e.customer_name}`);
      sendSmsViaEdge(e.customer_phone, message)
        .then((r) => { if (!r.success) toast.warning("Called. SMS failed — check Pindo settings."); })
        .catch(() => toast.warning("Called. SMS failed — check Pindo settings."));
    } else {
      toast.success(`Called ${e.customer_name}`);
    }
    triggerHeadsupIfNeeded();
  };

  const setStatus = async (e: Entry, status: "served" | "no_show") => {
    const patch = status === "served"
      ? { status, served_at: new Date().toISOString() }
      : { status };
    const { error } = await supabase.from("queue_entries").update(patch).eq("id", e.id);
    if (error) { toast.error("Could not update: " + error.message); return; }
    toast.success(status === "served" ? "Marked served" : "Marked no-show");
    triggerHeadsupIfNeeded();
  };

  const waiting = entries.filter((e) => e.status === "waiting").length;
  const called = entries.filter((e) => e.status === "called").length;
  const served = entries.filter((e) => e.status === "served").length;

  const statusBadge: Record<Entry["status"], string> = {
    waiting: "bg-info/10 text-info border-info/20",
    called: "bg-warning/15 text-warning border-warning/30",
    served: "bg-success/10 text-success border-success/20",
    no_show: "bg-muted text-muted-foreground border-border",
  };
  const statusLabel: Record<Entry["status"], string> = {
    waiting: "Waiting", called: "Called", served: "Served", no_show: "No show",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Today's queue</div>
            <div className="text-sm font-medium truncate max-w-[180px]">{businessName ?? "—"}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-muted-foreground">Sign out</button>
        </div>
        <div className="max-w-md mx-auto px-4 pb-3 grid grid-cols-3 gap-2">
          <SummaryStat label="Waiting" value={waiting} accent="text-info" />
          <SummaryStat label="Called" value={called} accent="text-warning" />
          <SummaryStat label="Served" value={served} accent="text-success" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-28">
        {entries.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
            No one in the queue yet. Add your first customer.
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="bg-card border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-md bg-secondary flex items-center justify-center font-semibold text-secondary-foreground">
                    {e.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{e.customer_name}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusBadge[e.status]}`}>
                        {statusLabel[e.status]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.customer_phone} · {new Date(e.added_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                    </div>
                    {(e.status === "waiting" || e.status === "called") && (
                      <div className="mt-3 flex gap-2">
                        {e.status === "waiting" && (
                          <Button size="sm" onClick={() => callEntry(e)} className="flex-1">Call</Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setStatus(e, "served")} className="flex-1">Served</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(e, "no_show")} className="flex-1">No show</Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-center text-muted-foreground mt-6">
          {copy.customer}s called: "{copy.called}"
        </p>
      </main>

      <Link
        to="/queue-add"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 h-14 rounded-full shadow-lg shadow-primary/25 font-medium"
      >
        <Plus className="h-5 w-5" /> Add to queue
      </Link>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-card border rounded-md py-2 px-2 text-center">
      <div className={`text-xl font-semibold tabular-nums ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}