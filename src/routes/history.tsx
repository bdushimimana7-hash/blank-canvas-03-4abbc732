import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { ArrowLeft, Download, ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: History,
  head: () => ({ meta: [{ title: "History — Possac" }] }),
});

interface Entry {
  id: string;
  customer_name: string;
  customer_phone: string;
  position: number;
  status: string;
  added_at: string;
  called_at: string | null;
  served_at: string | null;
  wait_minutes: number | null;
  queue_id: string;
}
interface QueueRow { id: string; date: string }

function History() {
  const navigate = useNavigate();
  const { user, loading, role, businessId, businessName } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (role !== "owner" && role !== "superadmin") {
      navigate({ to: role === "staff" ? "/queue" : "/dashboard" });
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      setFetching(true);
      const { data: qs } = await supabase
        .from("queues").select("id, date").eq("business_id", businessId);
      const queueRows = (qs ?? []) as QueueRow[];
      setQueues(queueRows);
      const { data: es } = await supabase
        .from("queue_entries")
        .select("id, customer_name, customer_phone, position, status, added_at, called_at, served_at, wait_minutes, queue_id")
        .eq("business_id", businessId)
        .order("added_at", { ascending: false });
      setEntries((es ?? []) as Entry[]);
      setFetching(false);
    })();
  }, [businessId]);

  const dateByQueue = useMemo(() => {
    const m = new Map<string, string>();
    queues.forEach((q) => m.set(q.id, q.date));
    return m;
  }, [queues]);

  const grouped = useMemo(() => {
    const g = new Map<string, Entry[]>();
    entries.forEach((e) => {
      const d = dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10);
      if (!g.has(d)) g.set(d, []);
      g.get(d)!.push(e);
    });
    return Array.from(g.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries, dateByQueue]);

  const allTime = useMemo(() => {
    const served = entries.filter((e) => e.status === "served");
    const noShow = entries.filter((e) => e.status === "no_show").length;
    const durations = served
      .filter((e) => e.served_at)
      .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const counts = new Map<string, number>();
    entries.forEach((e) => {
      const d = dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    });
    const entriesArr = Array.from(counts.entries());
    const busiest = entriesArr.length
      ? entriesArr.reduce<{ date: string; count: number }>(
          (acc, [date, count]) => (count > acc.count ? { date, count } : acc),
          { date: entriesArr[0][0], count: entriesArr[0][1] },
        )
      : null;
    const noShowRate = entries.length ? Math.round((noShow / entries.length) * 100) : 0;
    return { servedCount: served.length, avg, busiest, noShowRate };
  }, [entries, dateByQueue]);

  const downloadCsv = () => {
    const header = ["date", "customer_name", "phone", "position", "status", "added_at", "called_at", "served_at", "wait_minutes"];
    const rows = entries.map((e) => {
      const date = dateByQueue.get(e.queue_id) ?? e.added_at.slice(0, 10);
      return [
        date,
        csvEscape(e.customer_name),
        csvEscape(e.customer_phone),
        String(e.position),
        e.status,
        e.added_at,
        e.called_at ?? "",
        e.served_at ?? "",
        e.wait_minutes != null ? String(e.wait_minutes) : "",
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <PossacLogo />
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Queue history</h1>
            <p className="text-sm text-muted-foreground">All past queue entries for {businessName ?? "your business"}.</p>
          </div>
          <button
            onClick={downloadCsv}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Download CSV
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard label="Served (all time)" value={allTime.servedCount} tone="success" />
          <StatCard label="Avg wait" value={allTime.avg} suffix="min" />
          <StatCard
            label="Busiest day"
            value={allTime.busiest ? allTime.busiest.count : 0}
            suffix={allTime.busiest ? formatShortDate(allTime.busiest.date) : ""}
          />
          <StatCard label="No-show rate" value={allTime.noShowRate} suffix="%" tone="muted" />
        </div>

        {fetching ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : grouped.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No queue entries yet.</p>
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
                <div key={date} className="bg-card border rounded-xl overflow-hidden">
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-accent/40 text-left"
                    onClick={() => setOpenDays((s) => ({ ...s, [date]: !open }))}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      <span className="font-medium truncate">{formatLongDate(date)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span><span className="text-foreground font-semibold tabular-nums">{total}</span> total</span>
                      <span><span className="text-success font-semibold tabular-nums">{served}</span> served</span>
                      <span><span className="text-foreground font-semibold tabular-nums">{noShow}</span> no-show</span>
                      <span><span className="text-foreground font-semibold tabular-nums">{avg}</span>m avg</span>
                    </div>
                  </button>
                  {open && (
                    <div className="border-t overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2 font-medium">#</th>
                            <th className="px-4 py-2 font-medium">Name</th>
                            <th className="px-4 py-2 font-medium">Phone</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 font-medium">Added</th>
                            <th className="px-4 py-2 font-medium">Called</th>
                            <th className="px-4 py-2 font-medium">Served</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayEntries
                            .slice()
                            .sort((a, b) => a.position - b.position)
                            .map((e) => (
                              <tr key={e.id} className="border-t">
                                <td className="px-4 py-2 tabular-nums">{e.position}</td>
                                <td className="px-4 py-2">{e.customer_name}</td>
                                <td className="px-4 py-2 text-muted-foreground">{e.customer_phone}</td>
                                <td className="px-4 py-2"><StatusBadge status={e.status} /></td>
                                <td className="px-4 py-2 text-muted-foreground">{formatTime(e.added_at)}</td>
                                <td className="px-4 py-2 text-muted-foreground">{e.called_at ? formatTime(e.called_at) : "—"}</td>
                                <td className="px-4 py-2 text-muted-foreground">{e.served_at ? formatTime(e.served_at) : "—"}</td>
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

function StatCard({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone?: "info" | "success" | "muted" }) {
  const accent =
    tone === "info" ? "text-info" :
    tone === "success" ? "text-success" :
    tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>
        {value}
        {suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    waiting: "bg-info/15 text-info",
    called: "bg-warning/15 text-warning",
    served: "bg-success/15 text-success",
    no_show: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{status.replace("_", " ")}</span>;
}

function formatLongDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatShortDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}