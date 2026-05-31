import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { sectorCopy } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { sendSmsViaEdge } from "@/lib/edge-functions";
import { Plus, Search } from "lucide-react";

interface Entry {
  id: string; customer_name: string; customer_phone: string;
  position: number; status: "waiting" | "called" | "served" | "no_show";
  added_at: string; called_at: string | null; served_at: string | null;
  headsup_sent: boolean; added_by: string | null;
}

// Track locally which entries staff marked as "arrived"
const arrivedSet = new Set<string>();

export default function LiveQueue() {
  const navigate = useNavigate();
  const { user, loading, businessId, sector, businessName } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [arrived, setArrived] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [hideServed, setHideServed] = useState(false);

  useEffect(() => { document.title = "Live queue — Possac"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!businessId) return;
    const { data: q } = await supabase.from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (!q) { setEntries([]); return; }
    const { data } = await supabase.from("queue_entries").select("*").eq("queue_id", q.id).order("position");
    setEntries((data ?? []) as Entry[]);
  }, [businessId, today]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!businessId) return;
    const ch = supabase.channel("queue-" + businessId)
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_entries", filter: `business_id=eq.${businessId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [businessId, load]);

  const copy = sectorCopy(sector);

  const triggerHeadsup = async () => {
    if (!businessId) return;
    const { data: q } = await supabase.from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
    if (!q) return;
    const { data: wl } = await supabase.from("queue_entries").select("id,customer_name,customer_phone,headsup_sent,wait_minutes").eq("queue_id", q.id).eq("status", "waiting").order("position");
    const { data: bc } = await supabase.from("businesses").select("headsup_position").eq("id", businessId).maybeSingle();
    const hp = Math.max(1, Math.min(5, bc?.headsup_position ?? 3));
    if (!wl || wl.length < hp) return;
    const t = wl[hp - 1];
    if (t.headsup_sent) return;
    const { data: claimed } = await supabase.from("queue_entries").update({ headsup_sent: true }).eq("id", t.id).eq("headsup_sent", false).select("id");
    if (!claimed?.length) return;
    const { data: biz } = await supabase.from("businesses").select("sms_template_headsup").eq("id", businessId).single();
    if (!biz?.sms_template_headsup) return;
    const msg = fillTemplate(biz.sms_template_headsup, { name: t.customer_name, position: hp, wait: t.wait_minutes ?? 0, business: businessName ?? "" });
    const r = await sendSmsViaEdge(t.customer_phone, msg);
    if (!r.success) await supabase.from("queue_entries").update({ headsup_sent: false }).eq("id", t.id);
  };

  const callEntry = async (e: Entry) => {
    const { error } = await supabase.from("queue_entries").update({ status: "called", called_at: new Date().toISOString() }).eq("id", e.id);
    if (error) { toast.error("Could not update"); return; }
    const { data: biz } = await supabase.from("businesses").select("sms_template_call").eq("id", businessId!).single();
    if (biz?.sms_template_call) {
      const msg = fillTemplate(biz.sms_template_call, { name: e.customer_name, position: e.position, wait: 0, business: businessName ?? "" });
      toast.success(`Called ${e.customer_name}`);
      sendSmsViaEdge(e.customer_phone, msg).then((r) => { if (!r.success) toast.warning("SMS failed"); }).catch(() => toast.warning("SMS failed"));
    } else toast.success(`Called ${e.customer_name}`);
    triggerHeadsup();
  };

  const setStatus = async (e: Entry, status: "served" | "no_show") => {
    const patch = status === "served" ? { status, served_at: new Date().toISOString() } : { status };
    const { error } = await supabase.from("queue_entries").update(patch).eq("id", e.id);
    if (error) { toast.error("Could not update"); return; }
    toast.success(status === "served" ? "Marked served" : "Marked no-show");
    triggerHeadsup();
  };

  const markArrived = (id: string) => {
    setArrived((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    toast.success("Marked as arrived");
  };

  const waiting = entries.filter((e) => e.status === "waiting").length;
  const called  = entries.filter((e) => e.status === "called").length;
  const served  = entries.filter((e) => e.status === "served").length;
  const normalizedSearch = search.trim().toLowerCase();
  const visibleEntries = entries.filter((e) => {
    if (hideServed && (e.status === "served" || e.status === "no_show")) return false;
    if (!normalizedSearch) return true;
    return e.customer_name.toLowerCase().includes(normalizedSearch);
  });
  const activeEntries = visibleEntries.filter((e) => e.status === "waiting");
  const doneEntries = visibleEntries.filter((e) => e.status !== "waiting");

  const badge: Record<Entry["status"], { bg: string; text: string; label: string }> = {
    waiting: { bg: "bg-blue-50",   text: "text-blue-600",  label: "Waiting" },
    called:  { bg: "bg-amber-50",  text: "text-amber-600", label: "Called" },
    served:  { bg: "bg-green-50",  text: "text-green-600", label: "Served" },
    no_show: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "No show" },
  };

  // An entry is "self-joined" if added_by is null (no staff user id)
  const isSelfJoined = (e: Entry) => !e.added_by;

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-medium">Today's queue</div>
            <div className="text-[14px] font-semibold text-[#111827] truncate max-w-[200px] leading-tight">{businessName ?? "—"}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors">Dashboard</Link>
            <button onClick={() => supabase.auth.signOut()} className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors">Sign out</button>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3 grid grid-cols-3 gap-2">
          {[
            { label: "Waiting", value: waiting, color: "text-blue-600" },
            { label: "Called",  value: called,  color: "text-amber-500" },
            { label: "Served",  value: served,  color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl py-2 text-center">
              <div className={`text-xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* List */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-28">
        <div className="mb-4 rounded-2xl border border-[#DDD9D0] bg-white p-3 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A72]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name"
              className="h-11 w-full rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] pl-9 pr-3 text-sm outline-none focus:border-[#0F6E56]"
            />
          </div>
          <p className="mt-2 text-xs text-[#7A7A72]">Tip: Use Call to notify customers in order.</p>
        </div>
        {entries.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E5E7EB] mx-auto flex items-center justify-center mb-4">
              <Plus className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-medium text-[#111827]">Queue is empty</p>
            <p className="text-xs text-[#6B7280] mt-1">Add your first {copy.customer.toLowerCase()} to get started.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <ul className="space-y-2">
            {activeEntries.map((e) => {
              const isHere = arrived.has(e.id);
              const selfJoined = isSelfJoined(e);
              return (
                <li key={e.id} className="queue-row-animate bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0F6E56] flex items-center justify-center font-semibold text-white text-base shadow-sm">
                      {e.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#111827] text-sm truncate">{e.customer_name}</span>
                        {/* Arrived badge */}
                        {isHere && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            Here ✓
                          </span>
                        )}
                        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${badge[e.status].bg} ${badge[e.status].text} ml-auto`}>
                          {badge[e.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-[#9CA3AF]">
                          {e.customer_phone || "No phone"} · {new Date(e.added_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {selfJoined && (
                          <span className="text-[10px] text-[#0F6E56] bg-[#E8F5F1] px-1.5 py-0.5 rounded-md font-medium">QR</span>
                        )}
                      </div>
                      {(e.status === "waiting" || e.status === "called") && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {/* Arrived button — only for self-joined, not yet marked */}
                          {selfJoined && e.status === "waiting" && !isHere && (
                            <button
                              onClick={() => markArrived(e.id)}
                              className="h-8 px-3 border border-green-200 text-green-700 bg-green-50 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                            >
                              Arrived
                            </button>
                          )}
                          {e.status === "waiting" && (
                            <button onClick={() => callEntry(e)}
                              className="flex-1 h-8 bg-[#0F6E56] text-white rounded-lg text-xs font-medium hover:bg-[#0D5E49] transition-colors">
                              Call
                            </button>
                          )}
                          <button onClick={() => setStatus(e, "served")}
                            className="flex-1 h-8 border border-[#E5E7EB] text-[#374151] rounded-lg text-xs font-medium hover:bg-[#F9FAFB] transition-colors">
                            Served
                          </button>
                          <button onClick={() => setStatus(e, "no_show")}
                            className="flex-1 h-8 text-[#9CA3AF] rounded-lg text-xs hover:bg-[#F9FAFB] transition-colors">
                            No show
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            </ul>
            {doneEntries.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#DDD9D0]" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#7A7A72]">Called, served and no-show</span>
                  <div className="h-px flex-1 bg-[#DDD9D0]" />
                </div>
                <ul className="space-y-2">
                  {doneEntries.map((e) => (
                    <li key={e.id} className="queue-row-animate bg-white/70 border border-[#E5E7EB] rounded-2xl p-4 shadow-sm opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0F6E56] flex items-center justify-center font-semibold text-white text-base">{e.position}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#111827]">{e.customer_name}</span>
                            <span className={`ml-auto text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${badge[e.status].bg} ${badge[e.status].text}`}>
                              {badge[e.status].label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-[#9CA3AF]">{e.customer_phone || "No phone"} · {new Date(e.added_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                          {e.status === "called" && (
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => setStatus(e, "served")}
                                className="flex-1 h-8 border border-[#E5E7EB] text-[#374151] rounded-lg text-xs font-medium hover:bg-[#F9FAFB] transition-colors">
                                Served
                              </button>
                              <button onClick={() => setStatus(e, "no_show")}
                                className="flex-1 h-8 text-[#9CA3AF] rounded-lg text-xs hover:bg-[#F9FAFB] transition-colors">
                                No show
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {visibleEntries.length === 0 && (
              <div className="rounded-2xl border border-[#DDD9D0] bg-white p-6 text-center text-sm text-[#7A7A72]">No matching entries.</div>
            )}
            <button
              onClick={() => setHideServed((v) => !v)}
              className="w-full rounded-xl border border-[#DDD9D0] bg-white px-4 py-3 text-sm font-medium text-[#0E0E0C] transition-colors hover:border-[#0F6E56]/40 hover:bg-[#E8F5F1]"
            >
              {hideServed ? "Show served entries" : "Clear served entries"}
            </button>
          </div>
        )}
      </main>

      {/* FAB */}
      <Link to="/queue-add"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-[#0F6E56] text-white px-6 h-12 rounded-full shadow-lg font-medium text-sm hover:bg-[#0D5E49] transition-colors">
        <Plus className="h-4 w-4" />
        Add {copy.customer.toLowerCase()}
      </Link>
    </div>
  );
}
