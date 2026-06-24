import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { sectorCopy } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { sendSmsViaEdge } from "@/lib/edge-functions";
import { Plus, Search, LayoutDashboard, Clock } from "lucide-react";

interface Entry {
  id: string; customer_name: string; customer_phone: string;
  position: number; status: "waiting" | "called" | "served" | "no_show";
  added_at: string; called_at: string | null; served_at: string | null;
  headsup_sent: boolean; added_by: string | null; is_urgent: boolean;
}

function waitMinutes(addedAt: string) {
  return Math.floor((Date.now() - new Date(addedAt).getTime()) / 60000);
}

function WaitBadge({ addedAt }: { addedAt: string }) {
  const [mins, setMins] = useState(waitMinutes(addedAt));
  useEffect(() => {
    const t = setInterval(() => setMins(waitMinutes(addedAt)), 30000);
    return () => clearInterval(t);
  }, [addedAt]);
  const color =
    mins < 15 ? "text-[#0F6E56] bg-[#E8F5F1]" :
    mins < 30 ? "text-amber-600 bg-amber-50" :
    "text-red-600 bg-red-50";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${color}`}>
      <Clock className="h-2.5 w-2.5" />{mins}m
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E5E7EB] rounded-xl ${className ?? ""}`} />;
}

function QueueSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-[#E5E7EB] rounded-xl py-2 px-3 bg-white">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-2 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="bg-white border border-[#DDD9D0] rounded-2xl p-3">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveQueue() {
  const navigate = useNavigate();
  const { user, loading, businessId, businessName, sector } = useSession();
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [arrived, setArrived] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [hideServed, setHideServed] = useState(false);
  const queueIdRef = useRef<string | null>(null);

  useEffect(() => { document.title = "Live queue — Possac"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);

  const today = new Date().toISOString().slice(0, 10);
  const copy = sectorCopy(sector);

  const load = useCallback(async (initial = false) => {
    if (!businessId) return;
    const { data: q } = await supabase
      .from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (!q) {
      setEntries([]);
    } else {
      const { data } = await supabase
        .from("queue_entries").select("*").eq("queue_id", q.id).order("position");
      setEntries((data ?? []) as Entry[]);
    }
    if (initial) setReady(true);
  }, [businessId, today]);

  useEffect(() => {
    if (businessId) load(true);
  }, [businessId, load]);

  // Realtime: subscribe to today's queue_id specifically — not all business entries
  // This avoids triggering on historical data from previous days
  useEffect(() => {
    if (!businessId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.from("queues")
      .select("id")
      .eq("business_id", businessId)
      .eq("date", today)
      .maybeSingle()
      .then(({ data: q }) => {
        if (!q) return;
        channel = supabase.channel("queue-" + q.id)
          .on("postgres_changes", {
            event: "*", schema: "public", table: "queue_entries",
            filter: `queue_id=eq.${q.id}`,
          }, () => load(false))
          .subscribe();
      });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [businessId, today, load]);

  const triggerHeadsup = async () => {
    if (!businessId) return;
    const { data: q } = await supabase.from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (!q) return;
    const { data: wl } = await supabase.from("queue_entries")
      .select("id,customer_name,customer_phone,headsup_sent,wait_minutes")
      .eq("queue_id", q.id).eq("status", "waiting").order("position");
    const { data: bc } = await supabase.from("businesses").select("headsup_position").eq("id", businessId).maybeSingle();
    const hp = Math.max(1, Math.min(5, bc?.headsup_position ?? 3));
    if (!wl || wl.length < hp) return;
    const t = wl[hp - 1];
    if (t.headsup_sent) return;
    const { data: claimed } = await supabase.from("queue_entries")
      .update({ headsup_sent: true }).eq("id", t.id).eq("headsup_sent", false).select("id");
    if (!claimed?.length) return;
    const { data: biz } = await supabase.from("businesses").select("sms_template_headsup").eq("id", businessId).single();
    if (!biz?.sms_template_headsup) return;
    const msg = fillTemplate(biz.sms_template_headsup, {
      name: t.customer_name, position: hp,
      wait: t.wait_minutes ?? 0, business: businessName ?? "",
    });
    const r = await sendSmsViaEdge(t.customer_phone, msg, {
      businessId: businessId!, messageType: "headsup", customerName: t.customer_name,
    });
    if (!r.success) await supabase.from("queue_entries").update({ headsup_sent: false }).eq("id", t.id);
  };

  const callEntry = async (e: Entry) => {
    const { error } = await supabase.from("queue_entries")
      .update({ status: "called", called_at: new Date().toISOString() }).eq("id", e.id);
    if (error) { toast.error("Could not update"); return; }
    const { data: biz } = await supabase.from("businesses").select("sms_template_call").eq("id", businessId!).single();
    if (biz?.sms_template_call) {
      const msg = fillTemplate(biz.sms_template_call, {
        name: e.customer_name, position: e.position, wait: 0, business: businessName ?? "",
      });
      toast.success(`Called ${e.customer_name}`);
      sendSmsViaEdge(e.customer_phone, msg, {
        businessId: businessId!, messageType: "call", customerName: e.customer_name,
      }).then((r) => { if (!r.success) toast.warning("SMS failed"); }).catch(() => toast.warning("SMS failed"));
    } else {
      toast.success(`Called ${e.customer_name}`);
    }
    triggerHeadsup();
  };

  const callNext = () => {
    const next = entries.find((e) => e.status === "waiting");
    if (next) callEntry(next);
  };

  const setStatus = async (e: Entry, status: "served" | "no_show") => {
    const patch = status === "served" ? { status, served_at: new Date().toISOString() } : { status };
    const { error } = await supabase.from("queue_entries").update(patch).eq("id", e.id);
    if (error) { toast.error("Could not update"); return; }
    toast.success(status === "served" ? "Marked served" : "Marked no-show");
    triggerHeadsup();
  };

  const markArrived = (id: string) => {
    setArrived((prev) => { const next = new Set(prev); next.add(id); return next; });
    toast.success("Marked as arrived");
  };

  const promoteToUrgent = async (e: Entry) => {
    if (!businessId) return;
    // Find the current position-1 patient (who will be displaced)
    const currentFirst = entries.find((en) => en.status === "waiting" && en.position === 1 && en.id !== e.id);
    // Push all waiting entries that are ahead of or at position 1 down by 1
    const toShift = entries.filter((en) => en.status === "waiting" && en.id !== e.id);
    await Promise.all(toShift.map((w) =>
      supabase.from("queue_entries").update({ position: w.position + 1 }).eq("id", w.id)
    ));
    // Set this entry to position 1 and mark urgent
    const { error } = await supabase.from("queue_entries")
      .update({ position: 1, is_urgent: true }).eq("id", e.id);
    if (error) { toast.error("Could not promote patient"); return; }
    toast.success(`${e.customer_name} moved to position 1`);
    // Notify only the person who was at position 1 — they're the one who was about to be called
    if (currentFirst?.customer_phone) {
      const msg = `Hi ${currentFirst.customer_name}, an urgent patient has been prioritised ahead of you at ${businessName ?? "the clinic"}. You are now number 2. Thank you for your understanding.`;
      sendSmsViaEdge(currentFirst.customer_phone, msg, {
        businessId: businessId!, messageType: "other", customerName: currentFirst.customer_name,
      }).catch(() => {});
    }
    load(false);
  };

  if (loading || !ready) return <QueueSkeleton />;

  const waiting = entries.filter((e) => e.status === "waiting").length;
  const called  = entries.filter((e) => e.status === "called").length;
  const served  = entries.filter((e) => e.status === "served").length;
  const normalizedSearch = search.trim().toLowerCase();

  const visibleEntries = entries.filter((e) => {
    if (hideServed && (e.status === "served" || e.status === "no_show")) return false;
    if (!normalizedSearch) return true;
    return e.customer_name.toLowerCase().includes(normalizedSearch);
  });

  const waitingEntries = visibleEntries.filter((e) => e.status === "waiting");
  const calledEntries  = visibleEntries.filter((e) => e.status === "called");
  const doneEntries    = visibleEntries.filter((e) => e.status === "served" || e.status === "no_show");
  const isSelfJoined   = (e: Entry) => !e.added_by;

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#E5E7EB]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-medium">Live queue</div>
            <div className="text-sm font-semibold text-[#111827] truncate max-w-[180px]">{businessName ?? "—"}</div>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827] transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </Link>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3 grid grid-cols-3 gap-2">
          {[
            { label: "Waiting", value: waiting, color: "text-[#0F6E56]", bg: "bg-[#E8F5F1]" },
            { label: "Called",  value: called,  color: "text-amber-600", bg: "bg-amber-50"  },
            { label: "Served",  value: served,  color: "text-[#374151]", bg: "bg-[#F9FAFB]" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-[#E5E7EB] rounded-xl py-2 text-center`}>
              <div className={`text-xl font-bold tabular-nums ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
              <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-32">
        <div className="mb-4 rounded-2xl border border-[#DDD9D0] bg-white p-3 shadow-sm space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name"
              className="h-10 w-full rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] pl-9 pr-3 text-sm outline-none focus:border-[#0F6E56] transition-colors"
            />
          </div>
          {waiting > 0 && (
            <button onClick={callNext}
              className="w-full h-10 bg-[#0F6E56] text-white rounded-xl text-sm font-semibold hover:bg-[#0a5a44] transition-all flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Call next
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F5F1] mx-auto flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-[#0F6E56]" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">Queue is empty</p>
            <p className="text-xs text-[#6B7280] mt-1 mb-5">
              Add your first {copy.customer.toLowerCase()} to get started.
            </p>
            <Link to="/queue-add"
              className="inline-flex items-center gap-2 bg-[#0F6E56] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5a44] transition-colors">
              <Plus className="h-4 w-4" /> Add {copy.customer.toLowerCase()}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {waitingEntries.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#0F6E56] animate-pulse" />
                  <span className="text-xs font-semibold text-[#0F6E56] uppercase tracking-widest">
                    Waiting — {waitingEntries.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {waitingEntries.map((e) => {
                    const isHere     = arrived.has(e.id);
                    const selfJoined = isSelfJoined(e);
                    return (
                      <li key={e.id} className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${e.is_urgent ? "bg-red-50 border-red-200" : "bg-white border-[#E5E7EB]"}`}>
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm ${e.is_urgent ? "bg-red-500" : "bg-[#0F6E56]"}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                            {e.is_urgent ? "!" : e.position}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#111827] text-sm">{e.customer_name}</span>
                              {e.is_urgent && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">🚨 URGENT</span>}
                              {isHere     && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Here</span>}
                              {selfJoined && <span className="text-[10px] text-[#0F6E56] bg-[#E8F5F1] px-1.5 py-0.5 rounded-md font-medium">QR</span>}
                              <div className="ml-auto"><WaitBadge addedAt={e.added_at} /></div>
                            </div>
                            <div className="text-xs text-[#9CA3AF] mt-0.5">
                              {e.customer_phone || "No phone"} · joined {new Date(e.added_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="mt-3 flex gap-2 flex-wrap">
                              {selfJoined && !isHere && (
                                <button onClick={() => markArrived(e.id)}
                                  className="h-8 px-3 border border-green-200 text-green-700 bg-green-50 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                                  Arrived
                                </button>
                              )}
                              {!e.is_urgent && e.position !== 1 && (
                                <button onClick={() => promoteToUrgent(e)}
                                  className="h-8 px-3 border border-red-200 text-red-500 bg-red-50 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                                  🚨 Urgent
                                </button>
                              )}
                              <button onClick={() => callEntry(e)}
                                className="flex-1 h-8 bg-[#0F6E56] text-white rounded-lg text-xs font-semibold hover:bg-[#0D5E49] transition-colors">
                                Call
                              </button>
                              <button onClick={() => setStatus(e, "served")}
                                className="flex-1 h-8 border border-[#E5E7EB] text-[#374151] rounded-lg text-xs font-medium hover:bg-[#F9FAFB] transition-colors">
                                Served
                              </button>
                              <button onClick={() => setStatus(e, "no_show")}
                                className="h-8 px-3 text-[#9CA3AF] rounded-lg text-xs hover:bg-[#F9FAFB] transition-colors">
                                No show
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {calledEntries.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-[#DDD9D0]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">Called — {calledEntries.length}</span>
                  <div className="h-px flex-1 bg-[#DDD9D0]" />
                </div>
                <ul className="space-y-2">
                  {calledEntries.map((e) => (
                    <li key={e.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-400 flex items-center justify-center font-bold text-white text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {e.position}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#111827] text-sm">{e.customer_name}</span>
                            <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Called</span>
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5">{e.customer_phone || "No phone"}</div>
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => setStatus(e, "served")}
                              className="flex-1 h-8 bg-[#0F6E56] text-white rounded-lg text-xs font-semibold hover:bg-[#0D5E49] transition-colors">
                              Served
                            </button>
                            <button onClick={() => setStatus(e, "no_show")}
                              className="flex-1 h-8 border border-[#E5E7EB] text-[#9CA3AF] rounded-lg text-xs hover:bg-white transition-colors">
                              No show
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doneEntries.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-[#DDD9D0]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7A7A72]">Served & no-show</span>
                  <div className="h-px flex-1 bg-[#DDD9D0]" />
                </div>
                <ul className="space-y-2">
                  {doneEntries.map((e) => (
                    <li key={e.id} className="bg-white/60 border border-[#E5E7EB] rounded-2xl p-4 opacity-70">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-[#E5E7EB] flex items-center justify-center font-semibold text-[#9CA3AF] text-base">
                          {e.position}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#374151]">{e.customer_name}</span>
                            <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${e.status === "served" ? "bg-green-50 text-green-600" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                              {e.status === "served" ? "Served" : "No show"}
                            </span>
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5">{e.customer_phone || "No phone"}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visibleEntries.length === 0 && search && (
              <div className="rounded-2xl border border-[#DDD9D0] bg-white p-6 text-center text-sm text-[#7A7A72]">
                No results for "{search}"
              </div>
            )}

            <button
              onClick={() => setHideServed((v) => !v)}
              className="w-full rounded-xl border border-[#DDD9D0] bg-white px-4 py-2.5 text-sm font-medium text-[#7A7A72] transition-colors hover:border-[#0F6E56]/40 hover:text-[#0F6E56] hover:bg-[#E8F5F1]">
              {hideServed ? "Show served entries" : "Hide served entries"}
            </button>
          </div>
        )}
      </main>

      {entries.length > 0 && (
        <Link to="/queue-add"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-[#0E0E0C] text-white px-6 h-12 rounded-full shadow-xl font-medium text-sm hover:bg-[#1a1a16] transition-all hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Add {copy.customer.toLowerCase()}
        </Link>
      )}
    </div>
  );
}
