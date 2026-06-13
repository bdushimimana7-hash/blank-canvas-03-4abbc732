import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { ArrowLeft, Download, ChevronDown, ChevronRight } from "lucide-react";

interface Entry {
  id: string; customer_name: string; customer_phone: string;
  position: number; status: string;
  added_at: string; called_at: string | null; served_at: string | null;
  wait_minutes: number | null; queue_id: string;
}
interface QueueRow { id: string; date: string }

export default function History() {
  const navigate = useNavigate();
  const { user, loading, role, businessId, businessName } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [fetching, setFetching] = useState(true);
  const [range, setRange] = useState<"today" | "7" | "30" | "custom">("7");
  const [customStart, setCustomStart] = useState(new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));
  const isLimited = entries.length >= 1000;

  useEffect(() => { document.title = "History — Possac"; }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (role !== "owner" && role !== "superadmin") {
      navigate(role === "staff" ? "/queue" : "/dashboard");
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      setFetching(true);
      const { data: qs } = await supabase
        .from("queues").select("id, date").eq("business_id", businessId);
      setQueues((qs ?? []) as QueueRow[]);
      const { data: es } = await supabase
        .from("queue_entries")
        .select("id, customer_name, customer_phone, position, status, added_at, called_at, served_at, wait_minutes, queue_id")
        .eq("business_id", businessId)
        .order("added_at", { ascending: false })
        .limit(1000);
      setEntries((es ?? []) as Entry[]);
      setFetching(false);
    })();
  }, [businessId]);

  const dateByQueue = useMemo(() => {
    const m = new Map<string, string>();
    queues.forEach((q) => m.set(q.id, q.date));
    return m;
  }, [queues]);

  const filteredEntries = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date;
    if (range === "custom") {
      start = new Date(customStart + "T00:00:00");
      end = new Date(customEnd + "T23:59:59");
    } else {
      end = new Date(today.toISOString().slice(0, 10) + "T23:59:59");
      start = new Date(today);
      if (range === "7") start.setDate(today.getDate() - 6);
      else if (range === "30") start.setDate(today.getDate() - 29);
      start = new Date(start.toISOString().slice(0, 10) + "T00:00:00");
    }
    return entries.filter((e) => {
      const d = new Date((dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10)) + "T12:00:00");
      return d >= start && d <= end;
    });
  }, [entries, dateByQueue, range, customStart, customEnd]);

  const grouped = useMemo(() => {
    const g = new Map<string, Entry[]>();
    filteredEntries.forEach((e) => {
      const d = dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10);
      if (!g.has(d)) g.set(d, []);
      g.get(d)!.push(e);
    });
    return Array.from(g.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEntries, dateByQueue]);

  const allTime = useMemo(() => {
    const served = filteredEntries.filter((e) => e.status === "served");
    const noShow = filteredEntries.filter((e) => e.status === "no_show").length;
    const durations = served.filter((e) => e.served_at)
      .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const counts = new Map<string, number>();
    filteredEntries.forEach((e) => {
      const d = dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    });
    const entriesArr = Array.from(counts.entries());
    const busiest = entriesArr.length
      ? entriesArr.reduce<{ date: string; count: number }>(
          (acc, [date, count]) => (count > acc.count ? { date, count } : acc),
          { date: entriesArr[0][0], count: entriesArr[0][1] })
      : null;
    const noShowRate = filteredEntries.length ? Math.round((noShow / filteredEntries.length) * 100) : 0;
    return { servedCount: served.length, avg, busiest, noShowRate };
  }, [filteredEntries, dateByQueue]);

  const downloadCsv = () => {
    const header = ["date", "customer_name", "phone", "position", "status", "added_at", "called_at", "served_at", "wait_minutes"];
    const rows = filteredEntries.map((e) => {
      const date = dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10);
      return [
        date, csvEscape(e.customer_name), csvEscape(e.customer_phone),
        String(e.position), e.status, e.added_at, e.called_at ?? "",
        e.served_at ?? "", e.wait_minutes != null ? String(e.wait_minutes) : "",
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(businessName ?? "queue").replace(/\s+/g, "_")}_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0]">
      <header className="sticky top-0 z-10 border-b border-[#DDD9D0] bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <PossacLogo />
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7A7A72] hover:text-[#0E0E0C] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>Queue history</h1>
            <p className="text-sm text-[#7A7A72]">All past queue entries for {businessName ?? "your business"}.</p>
          </div>
          <button onClick={downloadCsv} disabled={filteredEntries.length === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0F6E56] text-white text-sm font-medium hover:bg-[#0a5a44] disabled:opacity-40 transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-[#DDD9D0] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-[#7A7A72] block mb-1">Date range</label>
              <select value={range} onChange={(e) => setRange(e.target.value as typeof range)}
                className="h-10 rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-3 text-sm outline-none focus:border-[#0F6E56]">
                <option value="today">Today</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {range === "custom" && (
              <>
                <div>
                  <label className="text-xs font-medium text-[#7A7A72] block mb-1">Start</label>
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                    className="h-10 rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-3 text-sm outline-none focus:border-[#0F6E56]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#7A7A72] block mb-1">End</label>
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-10 rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-3 text-sm outline-none focus:border-[#0F6E56]" />
                </div>
              </>
            )}
          </div>
        </div>

        {isLimited && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Showing the most recent 1,000 queue entries. Use a narrower date range to review older records.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Served", value: allTime.servedCount, suffix: undefined, color: "text-[#0F6E56]", bg: "bg-[#E8F5F1]" },
            { label: "Avg wait", value: allTime.avg, suffix: "min", color: "text-[#0E0E0C]", bg: "bg-white" },
            { label: "Busiest day", value: allTime.busiest?.count ?? 0, suffix: allTime.busiest ? formatShortDate(allTime.busiest.date) : undefined, color: "text-[#0E0E0C]", bg: "bg-white" },
            { label: "No-show rate", value: allTime.noShowRate, suffix: "%", color: "text-[#7A7A72]", bg: "bg-white" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-[#DDD9D0] rounded-2xl p-4 shadow-sm`}>
              <div className="text-xs font-medium text-[#7A7A72] uppercase tracking-widest mb-2">{s.label}</div>
              <div className={`text-2xl font-bold tabular-nums ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                {s.value}
                {s.suffix && <span className="text-sm font-medium text-[#7A7A72] ml-1">{s.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-white border border-[#DDD9D0] rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-[#7A7A72]">No queue entries found for this period.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map(([date, dayEntries]) => {
              const total = dayEntries.length;
              const served = dayEntries.filter((e) => e.status === "served").length;
              const noShow = dayEntries.filter((e) => e.status === "no_show").length;
              const durations = dayEntries
                .filter((e) => e.status === "served" && e.served_at)
                .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
              const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
              const open = openDays[date] ?? false;
              return (
                <div key={date} className="bg-white border border-[#DDD9D0] rounded-2xl overflow-hidden shadow-sm">
                  <button className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#F7F5F0] text-left transition-colors"
                    onClick={() => setOpenDays((s) => ({ ...s, [date]: !open }))}>
                    <div className="flex items-center gap-2 min-w-0">
                      {open
                        ? <ChevronDown className="h-4 w-4 shrink-0 text-[#0F6E56]" />
                        : <ChevronRight className="h-4 w-4 shrink-0 text-[#7A7A72]" />}
                      <span className="font-semibold text-[#0E0E0C] truncate">{formatLongDate(date)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#7A7A72] shrink-0">
                      <span><span className="text-[#0E0E0C] font-semibold tabular-nums">{total}</span> total</span>
                      <span><span className="text-[#0F6E56] font-semibold tabular-nums">{served}</span> served</span>
                      <span className="hidden sm:inline"><span className="text-[#0E0E0C] font-semibold tabular-nums">{noShow}</span> no-show</span>
                      <span className="hidden sm:inline"><span className="text-[#0E0E0C] font-semibold tabular-nums">{avg}</span>m avg</span>
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-[#F0EDE6] overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-[#7A7A72] bg-[#F7F5F0]">
                            <th className="px-4 py-2.5 font-medium">#</th>
                            <th className="px-4 py-2.5 font-medium">Name</th>
                            <th className="px-4 py-2.5 font-medium">Phone</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                            <th className="px-4 py-2.5 font-medium">Added</th>
                            <th className="px-4 py-2.5 font-medium">Called</th>
                            <th className="px-4 py-2.5 font-medium">Served</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayEntries.slice().sort((a, b) => a.position - b.position).map((e, index) => (
                            <tr key={e.id} className={`border-t border-[#F0EDE6] ${index % 2 ? "bg-[#FAFAF8]" : "bg-white"}`}>
                              <td className="px-4 py-2.5 tabular-nums text-[#7A7A72]">{e.position}</td>
                              <td className="px-4 py-2.5 font-medium text-[#0E0E0C]">{e.customer_name}</td>
                              <td className="px-4 py-2.5 text-[#7A7A72]">{e.customer_phone || "—"}</td>
                              <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                              <td className="px-4 py-2.5 text-[#7A7A72]">{formatTime(e.added_at)}</td>
                              <td className="px-4 py-2.5 text-[#7A7A72]">{e.called_at ? formatTime(e.called_at) : "—"}</td>
                              <td className="px-4 py-2.5 text-[#7A7A72]">{e.served_at ? formatTime(e.served_at) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    waiting: "bg-blue-50 text-blue-600",
    called: "bg-amber-50 text-amber-600",
    served: "bg-[#E8F5F1] text-[#0F6E56]",
    no_show: "bg-[#F7F5F0] text-[#7A7A72]",
    cancelled: "bg-[#F7F5F0] text-[#7A7A72]",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? "bg-[#F7F5F0] text-[#7A7A72]"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function formatLongDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatShortDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
