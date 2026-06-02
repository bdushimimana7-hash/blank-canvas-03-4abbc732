import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { sectorLabel } from "@/lib/sectors";
import { Settings as SettingsIcon, ListOrdered, History as HistoryIcon, Check, Circle, LayoutDashboard, Menu, X, LogOut, TrendingUp, Users, Clock, ArrowRight, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import QRCode from "qrcode";

interface Entry { status: string; added_at: string; served_at: string | null; }
interface RecentEntry { status: string; added_at: string; served_at: string | null; queue_id: string; }
interface QueueDay { id: string; date: string }

const DEFAULT_TEMPLATES = {
  sms_template_add: "Hi {name}, you are number {position} in the queue at {business}. Estimated wait: {wait} minutes. We will alert you when you are close.",
  sms_template_call: "Hi {name}, it is your turn at {business}. Please come in now.",
  sms_template_headsup: "Hi {name}, you are 3rd in line at {business}. Please start making your way back now.",
  sms_template_first: "Hi {name}, you are next in line at {business}. Please come in now or let staff know you have arrived.",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, businessId, businessName, sector, role } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [recentQueues, setRecentQueues] = useState<QueueDay[]>([]);
  const [onboarding, setOnboarding] = useState<{
    show: boolean; smsCustomized: boolean; hasStaff: boolean; hasEntry: boolean;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { document.title = "Dashboard — Possac"; }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
    else if (role === "staff") navigate("/queue");
    else if (role === "superadmin") navigate("/superadmin");
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

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data: biz } = await supabase
        .from("businesses")
        .select("onboarding_complete, sms_template_add, sms_template_call, sms_template_headsup, sms_template_first")
        .eq("id", businessId)
        .maybeSingle();
      if (!biz || biz.onboarding_complete) { setOnboarding(null); return; }
      const smsCustomized =
        biz.sms_template_add !== DEFAULT_TEMPLATES.sms_template_add ||
        biz.sms_template_call !== DEFAULT_TEMPLATES.sms_template_call ||
        biz.sms_template_headsup !== DEFAULT_TEMPLATES.sms_template_headsup ||
        biz.sms_template_first !== DEFAULT_TEMPLATES.sms_template_first;
      const { count: staffCount } = await supabase
        .from("staff_profiles").select("id", { count: "exact", head: true })
        .eq("business_id", businessId).neq("role", "owner");
      const hasStaff = (staffCount ?? 0) > 0;
      const { count: entryCount } = await supabase
        .from("queue_entries").select("id", { count: "exact", head: true })
        .eq("business_id", businessId);
      const hasEntry = (entryCount ?? 0) > 0;
      if (smsCustomized && hasStaff && hasEntry) {
        await supabase.from("businesses").update({ onboarding_complete: true }).eq("id", businessId);
        setOnboarding(null); return;
      }
      setOnboarding({ show: true, smsCustomized, hasStaff, hasEntry });
    })();
  }, [businessId]);

  const total = entries.length;
  const waiting = entries.filter((e) => e.status === "waiting").length;
  const served = entries.filter((e) => e.status === "served").length;
  const noShow = entries.filter((e) => e.status === "no_show").length;
  const called = entries.filter((e) => e.status === "called").length;
  const servedDurations = entries
    .filter((e) => e.status === "served" && e.served_at)
    .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
  const avgWait = servedDurations.length
    ? Math.round(servedDurations.reduce((a, b) => a + b, 0) / servedDurations.length) : 0;

  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  const chartData = hours.map((h) => ({
    hour: `${h}:00`,
    count: entries.filter((e) => new Date(e.added_at).getHours() === h).length,
  }));

  const dateByQueue = new Map(recentQueues.map((q) => [q.id, q.date]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const last7 = last7Days.map((date) => {
    const dayEntries = recent.filter((e) => dateByQueue.get(e.queue_id) === date);
    const servedDay = dayEntries.filter((e) => e.status === "served");
    const durations = servedDay.filter((e) => e.served_at)
      .map((e) => (new Date(e.served_at!).getTime() - new Date(e.added_at).getTime()) / 60000);
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    return { date, total: dayEntries.length, served: servedDay.length, noShow: dayEntries.filter((e) => e.status === "no_show").length, avg };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || businessName || "there";

  // Week performance
  const weekTotal = last7.reduce((a, b) => a + b.total, 0);
  const weekServed = last7.reduce((a, b) => a + b.served, 0);
  const serviceRate = weekTotal > 0 ? Math.round((weekServed / weekTotal) * 100) : 0;

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0] lg:flex">
      <button onClick={() => setSidebarOpen(true)} className="fixed left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDD9D0] bg-white text-[#0E0E0C] shadow-sm lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} active="dashboard" />

      <main className="mx-auto w-full max-w-5xl px-5 py-8 lg:ml-64">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#7A7A72] uppercase tracking-widest mb-1">{businessName ?? "—"} · {sectorLabel(sector)}</p>
              <h1 className="text-2xl font-bold text-[#0E0E0C] tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-sm text-[#7A7A72] mt-1">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>
            <Link to="/queue"
              className="shrink-0 inline-flex items-center gap-2 bg-[#0F6E56] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5a44] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#0F6E56]/20">
              <Zap className="h-4 w-4" />
              Live Queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {onboarding?.show && (
          <OnboardingCard smsCustomized={onboarding.smsCustomized} hasStaff={onboarding.hasStaff} hasEntry={onboarding.hasEntry} />
        )}

        {/* Today's stats */}
        <div className="mb-2">
          <h2 className="text-xs font-semibold text-[#7A7A72] uppercase tracking-widest">Today at a glance</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total" value={total} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Waiting" value={waiting} tone="info" icon={<Clock className="h-4 w-4" />} />
          <StatCard label="Called" value={called} tone="warning" icon={<Zap className="h-4 w-4" />} />
          <StatCard label="Served" value={served} tone="success" icon={<Check className="h-4 w-4" />} />
          <StatCard label="Avg wait" value={avgWait} suffix="min" icon={<TrendingUp className="h-4 w-4" />} />
        </div>

        {/* Live queue CTA when there are waiting customers */}
        {waiting > 0 && (
          <div className="mb-6 rounded-2xl bg-[#0F6E56] p-5 flex items-center justify-between gap-4 shadow-lg shadow-[#0F6E56]/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-medium text-white/70 uppercase tracking-widest">Live now</span>
              </div>
              <p className="text-white font-semibold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                {waiting} {waiting === 1 ? "customer" : "customers"} waiting
                {called > 0 && `, ${called} called`}
              </p>
            </div>
            <Link to="/queue" className="shrink-0 bg-white text-[#0F6E56] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#F0EDE6] transition-colors">
              Manage →
            </Link>
          </div>
        )}

        {total === 0 && <EmptyToday />}

        {/* Week summary strip */}
        {weekTotal > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "This week", value: weekTotal, sub: "customers" },
              { label: "Served", value: weekServed, sub: "this week" },
              { label: "Service rate", value: `${serviceRate}%`, sub: "served vs total" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#DDD9D0] rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-[#7A7A72] mb-1">{s.label}</div>
                <div className="text-2xl font-bold text-[#0E0E0C] tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                <div className="text-xs text-[#7A7A72]">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="mb-6 bg-white border border-[#DDD9D0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0E0E0C]">Queue volume by hour</h2>
              <p className="text-xs text-[#7A7A72]">Today's traffic pattern</p>
            </div>
            <span className="text-xs text-[#7A7A72] bg-[#F7F5F0] px-2 py-1 rounded-lg">Today</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
                <XAxis dataKey="hour" stroke="#7A7A72" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7A7A72" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#E8F5F1", radius: 6 }}
                  contentStyle={{ background: "#fff", border: "1px solid #DDD9D0", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" fill="#0F6E56" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Last 7 days table */}
        <div className="mb-6 bg-white border border-[#DDD9D0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0E0E0C]">Last 7 days</h2>
              <p className="text-xs text-[#7A7A72]">Daily performance breakdown</p>
            </div>
            <Link to="/history" className="text-xs font-medium text-[#0F6E56] hover:underline">Full history →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#7A7A72] border-b border-[#F0EDE6]">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium text-right">Total</th>
                  <th className="py-2 pr-4 font-medium text-right">Served</th>
                  <th className="py-2 pr-4 font-medium text-right">No-shows</th>
                  <th className="py-2 font-medium text-right">Avg wait</th>
                </tr>
              </thead>
              <tbody>
                {last7.map((d, i) => (
                  <tr key={d.date} className={`border-b border-[#F7F5F0] ${i % 2 === 0 ? "" : "bg-[#FAFAF8]"}`}>
                    <td className="py-2.5 pr-4 text-[#0E0E0C]">{new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-right font-medium">{d.total || "—"}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-right text-[#0F6E56] font-medium">{d.served || "—"}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-right text-[#7A7A72]">{d.noShow || "—"}</td>
                    <td className="py-2.5 tabular-nums text-right text-[#7A7A72]">{d.avg ? `${d.avg}m` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {businessId && <ShareQueueCard businessId={businessId} businessName={businessName ?? "queue"} />}
      </main>
    </div>
  );
}

export function DashboardSidebar({ open, onClose, active }: { open: boolean; onClose: () => void; active?: string }) {
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { to: "/queue", label: "Live Queue", icon: ListOrdered, key: "queue" },
    { to: "/history", label: "History", icon: HistoryIcon, key: "history" },
    { to: "/settings", label: "Settings", icon: SettingsIcon, key: "settings" },
  ];
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/25 lg:hidden ${open ? "block" : "hidden"}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#DDD9D0] bg-white flex flex-col transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-5 border-b border-[#F0EDE6]">
          <PossacLogo />
          <button onClick={onClose} className="lg:hidden text-[#7A7A72] hover:text-[#0E0E0C]"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => {
            const isActive = active === item.key;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-[#0F6E56] text-white shadow-sm" : "text-[#3A3A35] hover:bg-[#E8F5F1] hover:text-[#0F6E56]"}`}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {item.key === "queue" && <span className="ml-auto h-2 w-2 rounded-full bg-[#0F6E56] animate-pulse" style={{ background: isActive ? "white" : "#0F6E56" }} />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#F0EDE6]">
          <button onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#7A7A72] transition-colors hover:bg-[#F7F5F0] hover:text-[#0E0E0C]">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function EmptyToday() {
  return (
    <div className="mb-6 rounded-2xl border border-dashed border-[#DDD9D0] bg-white p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-[#E8F5F1] flex items-center justify-center mb-4">
        <Users className="h-6 w-6 text-[#0F6E56]" />
      </div>
      <h3 className="font-semibold text-[#0E0E0C] mb-1">No entries today yet</h3>
      <p className="text-sm text-[#7A7A72] mb-5">Your live stats and chart will fill in as customers join the queue.</p>
      <Link to="/queue-add" className="inline-flex items-center gap-2 bg-[#0F6E56] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5a44] transition-colors">
        Add first customer →
      </Link>
    </div>
  );
}

function StatCard({ label, value, suffix, tone, icon }: { label: string; value: number | string; suffix?: string; tone?: "info" | "success" | "muted" | "warning"; icon?: React.ReactNode }) {
  const styles = {
    info: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-400" },
    success: { bg: "bg-[#E8F5F1]", text: "text-[#0F6E56]", icon: "text-[#0F6E56]" },
    muted: { bg: "bg-[#F7F5F0]", text: "text-[#7A7A72]", icon: "text-[#7A7A72]" },
    warning: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-400" },
    default: { bg: "bg-white", text: "text-[#0E0E0C]", icon: "text-[#7A7A72]" },
  };
  const s = styles[tone ?? "default"];
  return (
    <div className={`${s.bg} border border-[#DDD9D0] rounded-2xl p-4 shadow-sm`}>
      <div className={`${s.icon} mb-2`}>{icon}</div>
      <div className={`text-2xl font-bold tabular-nums ${s.text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
        {value}{suffix && <span className="text-sm font-medium ml-1 opacity-70">{suffix}</span>}
      </div>
      <div className="text-xs text-[#7A7A72] mt-0.5">{label}</div>
    </div>
  );
}

function OnboardingCard({ smsCustomized, hasStaff, hasEntry }: { smsCustomized: boolean; hasStaff: boolean; hasEntry: boolean }) {
  const steps = [
    { label: "Account created", done: true, to: null as string | null },
    { label: "Customize your SMS messages", done: smsCustomized, to: "/settings" },
    { label: "Add your first staff member", done: hasStaff, to: "/settings" },
    { label: "Add your first customer to the queue", done: hasEntry, to: "/queue-add" },
  ];
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  return (
    <div className="mb-6 bg-white border border-[#DDD9D0] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-[#0E0E0C]">Get started</h2>
        <span className="text-xs text-[#0F6E56] font-medium">{completed}/{steps.length} done</span>
      </div>
      <p className="text-xs text-[#7A7A72] mb-4">Finish setting up your queue. This card disappears once you're done.</p>
      <div className="h-1.5 w-full bg-[#F0EDE6] rounded-full overflow-hidden mb-4">
        <div className="h-full bg-[#0F6E56] transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2">
        {steps.map((s) => {
          const content = (
            <div className={`flex items-center gap-3 py-2 px-3 rounded-xl ${s.to && !s.done ? "hover:bg-[#E8F5F1]" : ""}`}>
              {s.done ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F6E56] text-white shrink-0">
                  <Check className="h-3 w-3" />
                </span>
              ) : (
                <Circle className="h-5 w-5 text-[#DDD9D0] shrink-0" />
              )}
              <span className={`text-sm ${s.done ? "text-[#7A7A72] line-through" : "text-[#0E0E0C] font-medium"}`}>{s.label}</span>
              {s.to && !s.done && <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#0F6E56]" />}
            </div>
          );
          return <li key={s.label}>{s.to && !s.done ? <Link to={s.to}>{content}</Link> : content}</li>;
        })}
      </ul>
    </div>
  );
}

function ShareQueueCard({ businessId, businessName }: { businessId: string; businessName: string }) {
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const url = `${window.location.origin}/join/${businessId}`;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!previewRef.current) return;
    QRCode.toCanvas(previewRef.current, url, { width: 160, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
  }, [url]);
  const download = async () => {
    const dataUrl = await QRCode.toDataURL(url, { width: 1000, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
    const a = document.createElement("a"); a.href = dataUrl;
    const safe = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "queue";
    a.download = `possac-qr-${safe}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { }
  };
  return (
    <div className="bg-white border border-[#DDD9D0] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-[#0E0E0C]">Share your queue</h2>
        <span className="text-xs text-[#7A7A72]">Customers join in seconds</span>
      </div>
      <p className="text-xs text-[#7A7A72] mb-5">Print this QR and place it at your entrance. Anyone who scans it can join from their phone — no app needed.</p>
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="shrink-0 bg-white p-3 rounded-xl border border-[#DDD9D0] shadow-sm">
          <canvas ref={previewRef} className="block" />
        </div>
        <div className="flex-1 w-full">
          <div className="text-xs text-[#7A7A72] uppercase tracking-widest mb-1">Join link</div>
          <div className="rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-3 py-2.5 text-sm break-all font-mono text-[#0E0E0C]">{url}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={download} className="inline-flex items-center gap-2 bg-[#0F6E56] text-white text-sm font-medium px-4 h-9 rounded-xl hover:bg-[#0a5a44] transition-colors shadow-sm shadow-[#0F6E56]/20">
              Download QR
            </button>
            <button onClick={copy} className="inline-flex items-center gap-2 border border-[#DDD9D0] bg-white text-sm font-medium px-4 h-9 rounded-xl hover:bg-[#F7F5F0] transition-colors">
              {copied ? "✓ Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
