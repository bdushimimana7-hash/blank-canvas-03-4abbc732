import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTORS, sectorLabel } from "@/lib/sectors";
import { toast } from "sonner";
import { callAdmin } from "@/lib/edge-functions";

interface BizRow {
  id: string; name: string; sector: string; active: boolean;
  created_at: string;
  owner_email: string | null;
  total_served: number;
  entriesToday?: number;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, loading, role } = useSession();
  const [businesses, setBusinesses] = useState<BizRow[]>([]);
  const [smsToday, setSmsToday] = useState(0);
  const [entriesToday, setEntriesToday] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [bn, setBn] = useState("");
  const [bs, setBs] = useState("other");
  const [on, setOn] = useState("");
  const [oe, setOe] = useState("");
  const [op, setOp] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { document.title = "Superadmin — Possac"; }, []);
  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
    else if (role !== "superadmin") {
      if (role === "owner") navigate("/dashboard");
      else if (role === "staff") navigate("/queue");
    }
  }, [user, role, loading, navigate]);

  const reload = async () => {
    let baseRows: BizRow[] = [];
    try {
      const res = await callAdmin<{ businesses: BizRow[] }>("list_businesses_admin");
      baseRows = res.businesses;
    } catch (err) {
      toast.error((err as Error).message);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const rows: BizRow[] = [];
    let totalEntries = 0;
    for (const b of baseRows) {
      const { data: q } = await supabase
        .from("queues").select("id").eq("business_id", b.id).eq("date", today).maybeSingle();
      let count = 0;
      if (q) {
        const { count: c } = await supabase
          .from("queue_entries").select("id", { count: "exact", head: true }).eq("queue_id", q.id);
        count = c ?? 0;
      }
      totalEntries += count;
      rows.push({ ...b, entriesToday: count });
    }
    setBusinesses(rows);
    setEntriesToday(totalEntries);
    const { count: addedCount } = await supabase
      .from("queue_entries").select("id", { count: "exact", head: true })
      .gte("added_at", today + "T00:00:00");
    const { count: calledCount } = await supabase
      .from("queue_entries").select("id", { count: "exact", head: true })
      .gte("called_at", today + "T00:00:00");
    setSmsToday((addedCount ?? 0) + (calledCount ?? 0));
  };

  useEffect(() => {
    if (role === "superadmin") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await callAdmin("create_business_owner", {
        business_name: bn, sector: bs, owner_name: on, owner_email: oe, password: op,
      });
      toast.success("Business + owner created");
      setBn(""); setBs("other"); setOn(""); setOe(""); setOp("");
      setShowCreate(false);
      reload();
    } catch (err) { toast.error((err as Error).message); }
    finally { setCreating(false); }
  };

  const toggle = async (b: BizRow) => {
    try {
      await callAdmin("set_business_active", { business_id: b.id, active: !b.active });
      reload();
    } catch (err) { toast.error((err as Error).message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PossacLogo />
            <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              Superadmin
            </span>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Total businesses" value={businesses.length} />
          <Stat label="Entries today" value={entriesToday} />
          <Stat label="SMS sent today" value={smsToday} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Businesses</h2>
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "+ New business owner"}
          </Button>
        </div>

        {showCreate && (
          <form onSubmit={onCreate} className="mt-4 bg-card border rounded-xl p-5 grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input required value={bn} onChange={(e) => setBn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <select value={bs} onChange={(e) => setBs(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner full name</Label>
              <Input required value={on} onChange={(e) => setOn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner email</Label>
              <Input required type="email" value={oe} onChange={(e) => setOe(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Temporary password</Label>
              <Input required type="text" minLength={8} value={op} onChange={(e) => setOp(e.target.value)}
                placeholder="At least 8 characters" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
            </div>
          </form>
        )}

        <div className="mt-4 bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium p-3">Name</th>
                <th className="text-left font-medium p-3">Owner email</th>
                <th className="text-left font-medium p-3">Sector</th>
                <th className="text-left font-medium p-3">Joined</th>
                <th className="text-right font-medium p-3">Today</th>
                <th className="text-right font-medium p-3">Total served</th>
                <th className="text-left font-medium p-3">Status</th>
                <th className="text-right font-medium p-3"></th>
              </tr>
            </thead>
            <tbody>
              {businesses.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No businesses yet.</td></tr>
              )}
              {businesses.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-muted-foreground">{b.owner_email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{sectorLabel(b.sector)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right tabular-nums">{b.entriesToday ?? 0}</td>
                  <td className="p-3 text-right tabular-nums">{b.total_served}</td>
                  <td className="p-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${b.active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => toggle(b)} className="text-xs text-primary font-medium hover:underline">
                      {b.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}