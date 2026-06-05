import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTORS } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { toast } from "sonner";
import { callAdmin } from "@/lib/edge-functions";
import { ArrowLeft, Send, Trash2 } from "lucide-react";

interface StaffRow { id: string; user_id: string; full_name: string; role: string; }
interface SmsLogRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  message_type: string;
  status: string;
  created_at: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading, businessId, role } = useSession();
  const [name, setName] = useState("");
  const [sector, setSector] = useState("other");
  const [tplAdd, setTplAdd] = useState("");
  const [tplFirst, setTplFirst] = useState("");
  const [tplHeadsup, setTplHeadsup] = useState("");
  const [tplCall, setTplCall] = useState("");
  const [headsupPos, setHeadsupPos] = useState<number>(3);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLogRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => { document.title = "Settings — Possac"; }, []);
  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
    else if (role === "staff") navigate("/queue");
  }, [user, loading, role, navigate]);

  const reload = async () => {
    if (!businessId) return;
    const { data: biz } = await supabase
      .from("businesses").select("name, sector, sms_template_add, sms_template_first, sms_template_headsup, sms_template_call, headsup_position").eq("id", businessId).single();
    if (biz) {
      setName(biz.name); setSector(biz.sector);
      setTplAdd(biz.sms_template_add);
      setTplFirst((biz as { sms_template_first?: string }).sms_template_first ?? "");
      setTplHeadsup(biz.sms_template_headsup);
      setTplCall(biz.sms_template_call);
      setHeadsupPos((biz as { headsup_position?: number }).headsup_position ?? 3);
    }
    const { data: sp } = await supabase
      .from("staff_profiles").select("id, user_id, full_name, role").eq("business_id", businessId);
    setStaff((sp ?? []) as StaffRow[]);
    const { data: logs } = await supabase
      .from("sms_logs")
      .select("id, customer_name, customer_phone, message_type, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    setSmsLogs((logs ?? []) as SmsLogRow[]);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [businessId]);

  const save = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase.from("businesses")
      .update({
        name, sector,
        sms_template_add: tplAdd, sms_template_first: tplFirst,
        sms_template_headsup: tplHeadsup, sms_template_call: tplCall,
        headsup_position: headsupPos,
      })
      .eq("id", businessId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setInviting(true);
    try {
      await callAdmin("invite_staff", {
        business_id: businessId, full_name: inviteName, email: inviteEmail, password: invitePassword,
      });
      toast.success("Staff added");
      setInviteName(""); setInviteEmail(""); setInvitePassword("");
      reload();
    } catch (err) { toast.error((err as Error).message); }
    finally { setInviting(false); }
  };

  const onRemove = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    try {
      await callAdmin("remove_staff", { staff_profile_id: id });
      toast.success("Removed");
      reload();
    } catch (err) { toast.error((err as Error).message); }
  };

  const sendTest = async (template: string) => {
    const phone = user?.phone;
    if (!phone) {
      toast.error("No registered owner phone number found.");
      return;
    }
    const msg = fillTemplate(template, { name: "Jean", position: 6, wait: 45, business: name || "your business" });
    const r = await import("@/lib/edge-functions").then((m) => m.sendSmsViaEdge(phone, msg, { businessId: businessId ?? undefined, messageType: "other", customerName: "Test" }));
    if (r.success) toast.success("Test SMS sent"); else toast.error(r.error ?? "Test SMS failed");
  };

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0]">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <PossacLogo />
          <Link to="/dashboard" className="text-sm inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="Business Profile" />
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bname">Name</Label>
              <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bsector">Sector</Label>
              <select id="bsector" value={sector} onChange={(e) => setSector(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="SMS Templates" />
          <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Available variables — replaced automatically</div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
              <code className="px-1.5 py-0.5 bg-background border rounded">{`{name}`}</code>
              <code className="px-1.5 py-0.5 bg-background border rounded">{`{position}`}</code>
              <code className="px-1.5 py-0.5 bg-background border rounded">{`{business}`}</code>
              <code className="px-1.5 py-0.5 bg-background border rounded">{`{wait}`}</code>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <TemplateField id="tpla" label="1. When customer joins" value={tplAdd} onChange={setTplAdd} business={name} onTest={() => sendTest(tplAdd)} />
            <TemplateField id="tplf" label="2. When customer is first in queue" value={tplFirst} onChange={setTplFirst} business={name} onTest={() => sendTest(tplFirst)} />
            <div className="space-y-1.5">
              <Label htmlFor="hpos">Send heads-up SMS when customer reaches position:</Label>
              <select id="hpos" value={headsupPos} onChange={(e) => setHeadsupPos(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <TemplateField id="tplh" label={`3. Heads-up (auto-sent at position ${headsupPos})`} value={tplHeadsup} onChange={setTplHeadsup} business={name} onTest={() => sendTest(tplHeadsup)} />
            <TemplateField id="tplc" label="4. When customer is called" value={tplCall} onChange={setTplCall} business={name} onTest={() => sendTest(tplCall)} />
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>

        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="Team Members" />
          <p className="text-sm text-muted-foreground mt-1">Staff can only access the queue screens.</p>
          <ul className="mt-4 grid gap-3">
            {staff.length === 0 && (<li className="p-4 text-sm text-muted-foreground">No staff yet.</li>)}
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-2xl border border-[#DDD9D0] bg-[#F7F5F0] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F6E56] font-semibold text-white">
                    {initials(s.full_name || s.role)}
                  </div>
                  <div>
                  <div className="text-sm font-medium">{s.full_name || "(unnamed)"}</div>
                  <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#0F6E56]">{s.role}</span>
                  </div>
                </div>
                {s.role !== "owner" && (
                  <button onClick={() => onRemove(s.id)} className="text-destructive hover:text-destructive/80 p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={onInvite} className="mt-6 grid sm:grid-cols-2 gap-3 border-t pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="iname">Full name</Label>
              <Input id="iname" required value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iemail">Email</Label>
              <Input id="iemail" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ipw">Temporary password</Label>
              <Input id="ipw" type="text" required minLength={8} value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="At least 8 characters" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={inviting} variant="secondary">
                {inviting ? "Adding…" : "Add staff"}
              </Button>
            </div>
          </form>
        </section>

        <section className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
          <SectionHeading title="Danger Zone" />
          <p className="mt-2 text-sm text-muted-foreground">Removing staff access is permanent for that staff profile. Business deletion is handled by support.</p>
        </section>

        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="SMS Logs" />
          <p className="text-sm text-muted-foreground mt-1">Most recent 50 messages sent from this business.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium p-2">Time</th>
                  <th className="text-left font-medium p-2">Customer</th>
                  <th className="text-left font-medium p-2">Phone</th>
                  <th className="text-left font-medium p-2">Type</th>
                  <th className="text-left font-medium p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {smsLogs.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No messages yet.</td></tr>
                )}
                {smsLogs.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-2 text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-2">{l.customer_name || "—"}</td>
                    <td className="p-2 text-muted-foreground">{l.customer_phone || "—"}</td>
                    <td className="p-2"><span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted">{l.message_type}</span></td>
                    <td className="p-2">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${l.status === "sent" ? "bg-[#E8F5F1] text-[#0F6E56]" : "bg-red-50 text-red-600"}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="border-b border-[#DDD9D0] pb-4">
      <h2 className="font-display text-xl font-semibold text-[#0E0E0C]">{title}</h2>
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "P";
}

function TemplateField({ id, label, value, onChange, business, onTest }: {
  id: string; label: string; value: string; onChange: (v: string) => void; business: string; onTest: () => void;
}) {
  const preview = fillTemplate(value, { name: "Jean", position: 6, wait: 45, business: business || "your business" });
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <button type="button" onClick={onTest} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDD9D0] bg-white px-2.5 py-1 text-xs font-medium text-[#0F6E56] hover:bg-[#E8F5F1]">
          <Send className="h-3 w-3" /> Send test SMS
        </button>
      </div>
      <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="text-right text-xs text-muted-foreground">{value.length}/160 characters</div>
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
        <div className="text-sm mt-1 whitespace-pre-wrap">{preview}</div>
      </div>
    </div>
  );
}
