import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { sectorLabel } from "@/lib/sectors";
import { Settings as SettingsIcon, ListOrdered, History as HistoryIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Possac" }] }),
});

interface Entry {
  status: string; added_at: string; served_at: string | null;
}
interface RecentEntry {
  status: string; added_at: string; served_at: string | null; queue_id: string;
}
interface QueueDay { id: string; date: string }

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, businessId, businessName, sector, role } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [recentQueues, setRecentQueues] = useState<QueueDay[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (role === "staff") navigate({ to: "/queue" });
    else if (role === "superadmin") navigate({ to: "/superadmin" });
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (!businessId) return;
    const today = new Date().toISOString().slice(0, 10);
    (async () => {
      const { data: q } = await supabase
        .from("queues").select("id").eq("business_id", businessId).eq("date", today).maybeSingle();
      if (!q) { setEntries([]); return; }
      const { data } = await supabase
        .from("queue_entries").select("status, added_at, served_at").eq("queue_id", q.id);
      setEntries((data ?? []) as Entry[]);
    })();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceDate = since.toISOString().slice(0, 10);
    (async () => {
      const { data: qs } = await supabase
        .from("queues").select("id, date").eq("business_id", businessId).gte("date", sinceDate);
      const queueRows = (qs ?? []) as QueueDay[];
      setRecentQueues(queueRows);
      if (queueRows.length === 0) { setRecent([]); return; }
      const { data } = await supabase
        .from("queue_entries")
        .select("status, added_at, served_at, queue_id")
        .in("queue_id", queueRows.map((r) => r.id));
      setRecent((data ?? []) as RecentEntry[]);
    })();
  }, [businessId]);

  const total = entries.length;
  const waiting = entries.filter((e) => e.status === "waiting").length;
  const served = entries.filter((e) => e.status === "served").length;
  const noShow = entries.filter((e) => e.status === "no_show").length;

  const servedDurations = entries
    .filter((e) => e.status === "served" && e.served_at)
    .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
  const avgWait = servedDurations.length
    ? Math.round(servedDurations.reduce((a, b) => a + b, 0) / servedDurations.length)
    : 0;

  // Build hourly buckets
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm
  const chartData = hours.map((h) => ({
    hour: `${h}:00`,
    count: entries.filter((e) => new Date(e.added_at).getHours() === h).length,
  }));

  const dateByQueue = new Map(recentQueues.map((q) => [q.id, q.date]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const last7 = last7Days.map((date) => {
    const dayEntries = recent.filter((e) => dateByQueue.get(e.queue_id) === date);
    const served = dayEntries.filter((e) => e.status === "served");
    const durations = served
      .filter((e) => e.served_at)
      .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    return {
      date,
      total: dayEntries.length,
      served: served.length,
      noShow: dayEntries.filter((e) => e.status === "no_show").length,
      avg,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <PossacLogo />
          <div className="flex items-center gap-3">
            <Link to="/queue" className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4" /> Live queue
            </Link>
            <Link to="/history" className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5">
              <HistoryIcon className="h-4 w-4" /> History
            </Link>
            <Link to="/settings" className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5">
              <SettingsIcon className="h-4 w-4" /> Settings
            </Link>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight">{businessName ?? "—"}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
            {sectorLabel(sector)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Today, {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <StatCard label="Total today" value={total} />
          <StatCard label="Waiting" value={waiting} tone="info" />
          <StatCard label="Served" value={served} tone="success" />
          <StatCard label="No-shows" value={noShow} tone="muted" />
          <StatCard label="Avg wait" value={avgWait} suffix="min" />
        </div>

        <div className="mt-8 bg-card border rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-semibold">Queue volume by hour</h2>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} className="text-muted-foreground" />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 bg-card border rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-semibold">Last 7 days</h2>
            <Link to="/history" className="text-xs font-medium text-primary hover:underline">View full history →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                  <th className="py-2 pr-4 font-medium">Served</th>
                  <th className="py-2 pr-4 font-medium">No-shows</th>
                  <th className="py-2 pr-4 font-medium">Avg wait</th>
                </tr>
              </thead>
              <tbody>
                {last7.map((d) => (
                  <tr key={d.date} className="border-t">
                    <td className="py-2 pr-4">{new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</td>
                    <td className="py-2 pr-4 tabular-nums">{d.total}</td>
                    <td className="py-2 pr-4 tabular-nums text-success">{d.served}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">{d.noShow}</td>
                    <td className="py-2 pr-4 tabular-nums">{d.avg ? `${d.avg}m` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
        {value}{suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
