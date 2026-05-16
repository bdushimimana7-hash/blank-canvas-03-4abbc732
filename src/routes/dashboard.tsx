import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { sectorLabel } from "@/lib/sectors";
import { Settings as SettingsIcon, ListOrdered } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Possac" }] }),
});

interface Entry {
  status: string; added_at: string; served_at: string | null;
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, businessId, businessName, sector, role } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <PossacLogo />
          <div className="flex items-center gap-3">
            <Link to="/queue" className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4" /> Live queue
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
