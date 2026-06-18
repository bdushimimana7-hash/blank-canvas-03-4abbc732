import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTORS } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { toast } from "sonner";
import { callAdmin } from "@/lib/edge-functions";
import { ArrowLeft, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface StaffRow { id: string; user_id: string; full_name: string; role: string; }
interface SmsLogRow {
  id: string; customer_name: string; customer_phone: string;
  message: string; message_type: string; status: string; created_at: string;
}

// Variables available in templates
const VARS = [
  { key: "{name}",     label: "Customer name", example: "Jean"         },
  { key: "{business}", label: "Business name",  example: "Salon Belle"  },
  { key: "{position}", label: "Queue position", example: "3"            },
  { key: "{wait}",     label: "Wait time (min)",example: "15"           },
];

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
      .from("businesses")
      .select("name, sector, sms_template_add, sms_template_first, sms_template_headsup, sms_template_call, headsup_position")
      .eq("id", businessId).single();
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
      .select("id, customer_name, customer_phone, message, message_type, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    setSmsLogs((logs ?? []) as SmsLogRow[]);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [businessId]);

  const save = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({
      name, sector,
      sms_template_add: tplAdd, sms_template_first: tplFirst,
      sms_template_headsup: tplHeadsup, sms_template_call: tplCall,
      headsup_position: headsupPos,
    }).eq("id", businessId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setInviting(true);
    try {
      await callAdmin("invite_staff", {
        business_id: businessId, full_name: inviteName,
        email: inviteEmail.trim(), password: invitePassword,
      });
      toast.success("Staff member added — they will receive login instructions by email");
      setInviteName(""); setInviteEmail(""); setInvitePassword("");
      reload();
    } catch (err) { toast.error((err as Error).message); }
    finally { setInviting(false); }
  };

  const onRemove = async (id: string) => {
    if (!confirm("Remove this staff member? They will lose access immediately.")) return;
    try {
      await callAdmin("remove_staff", { staff_profile_id: id });
      toast.success("Staff member removed");
      reload();
    } catch (err) { toast.error((err as Error).message); }
  };

  const sendTest = async (template: string) => {
    const phone = user?.phone;
    if (!phone) { toast.error("No phone number on your account to send a test to."); return; }
    const msg = fillTemplate(template, { name: "Jean", position: 6, wait: 45, business: name || "your business" });
    const r = await import("@/lib/edge-functions").then((m) =>
      m.sendSmsViaEdge(phone, msg, { businessId: businessId ?? undefined, messageType: "other", customerName: "Test" })
    );
    if (r.success) toast.success("Test SMS sent to your number");
    else toast.error(r.error ?? "Test SMS failed");
  };

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0]">
      <header className="sticky top-0 z-10 border-b border-[#DDD9D0] bg-white/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <PossacLogo />
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7A7A72] hover:text-[#0E0E0C] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">

        {/* Business profile */}
        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="Business Profile" />
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bname">Business name</Label>
              <Input id="bname" value={name} onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl border-[#DDD9D0]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bsector">Sector</Label>
              <select id="bsector" value={sector} onChange={(e) => setSector(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-[#DDD9D0] bg-white px-3 py-2 text-sm outline-none focus:border-[#0F6E56]">
                {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* SMS Templates */}
        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="SMS Messages" />
          <p className="text-sm text-[#7A7A72] mt-1 mb-5">
            These messages are sent automatically to your customers. Edit the text — the highlighted words are replaced automatically with real values.
          </p>

          <div className="space-y-4">
            <TemplateEditor
              label="1. When a customer joins the queue"
              description="Sent immediately when someone joins. Tells them their position and estimated wait."
              value={tplAdd}
              onChange={setTplAdd}
              businessName={name}
              onTest={() => sendTest(tplAdd)}
              previewVars={{ name: "Jean", position: 4, wait: 45, business: name || "your business" }}
            />
            <TemplateEditor
              label="2. When the customer reaches position 1"
              description="Sent when they become next in line. No wait time needed here."
              value={tplFirst}
              onChange={setTplFirst}
              businessName={name}
              onTest={() => sendTest(tplFirst)}
              previewVars={{ name: "Jean", position: 1, wait: 0, business: name || "your business" }}
            />
            <div className="rounded-xl border border-[#DDD9D0] p-4 bg-[#F7F5F0]">
              <Label htmlFor="hpos" className="text-sm font-medium text-[#0E0E0C]">
                Send an early heads-up when customer reaches position:
              </Label>
              <p className="text-xs text-[#7A7A72] mt-0.5 mb-3">
                This gives customers time to make their way back before it's their turn.
              </p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => setHeadsupPos(n)}
                    className={`h-10 w-10 rounded-xl border text-sm font-semibold transition-all ${
                      headsupPos === n
                        ? "bg-[#0F6E56] text-white border-[#0F6E56]"
                        : "border-[#DDD9D0] text-[#0E0E0C] hover:border-[#0F6E56]/40"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <TemplateEditor
              label={`3. Heads-up (sent when customer reaches position ${headsupPos})`}
              description="Gives the customer advance notice to head back."
              value={tplHeadsup}
              onChange={setTplHeadsup}
              businessName={name}
              onTest={() => sendTest(tplHeadsup)}
              previewVars={{ name: "Jean", position: headsupPos, wait: headsupPos * 15, business: name || "your business" }}
            />
            <TemplateEditor
              label="4. When staff calls the customer"
              description="Sent the moment a staff member presses 'Call' — tells the customer it's their turn."
              value={tplCall}
              onChange={setTplCall}
              businessName={name}
              onTest={() => sendTest(tplCall)}
              previewVars={{ name: "Jean", position: 1, wait: 0, business: name || "your business" }}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}
            className="bg-[#0F6E56] hover:bg-[#0a5a44] text-white px-6 h-11 rounded-xl font-medium">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        {/* Team Members */}
        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="Team Members" />
          <p className="text-sm text-[#7A7A72] mt-1">
            Staff members can access the live queue screen. They will receive an email with login instructions.
          </p>

          <ul className="mt-4 space-y-2">
            {staff.length === 0 && (
              <li className="p-4 text-sm text-[#7A7A72] text-center border border-dashed border-[#DDD9D0] rounded-xl">
                No staff members yet.
              </li>
            )}
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-2xl border border-[#DDD9D0] bg-[#F7F5F0] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6E56] font-semibold text-white text-sm">
                    {initials(s.full_name || s.role)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#0E0E0C]">{s.full_name || "(unnamed)"}</div>
                    <span className="mt-0.5 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#0F6E56]">
                      {s.role}
                    </span>
                  </div>
                </div>
                {s.role !== "owner" && (
                  <button onClick={() => onRemove(s.id)}
                    className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-[#F0EDE6] pt-6">
            <h3 className="text-sm font-semibold text-[#0E0E0C] mb-1">Add a staff member</h3>
            <p className="text-xs text-[#7A7A72] mb-4">
              They will receive an email with their login details and instructions on how to use Possac.
            </p>
            <form onSubmit={onInvite} className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="iname">Full name</Label>
                <Input id="iname" required value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="h-11 rounded-xl border-[#DDD9D0]" placeholder="e.g. Alice Uwase" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iemail">Email address</Label>
                <Input id="iemail" type="email" required value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-11 rounded-xl border-[#DDD9D0]" placeholder="alice@example.com" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ipw">Temporary password</Label>
                <Input id="ipw" type="text" required minLength={8} value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="h-11 rounded-xl border-[#DDD9D0]" placeholder="At least 8 characters — they can change it after logging in" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={inviting}
                  className="bg-[#0F6E56] hover:bg-[#0a5a44] text-white px-6 h-11 rounded-xl font-medium">
                  {inviting ? "Adding…" : "Add staff member"}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* SMS Logs */}
        <section className="bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <SectionHeading title="SMS Logs" />
          <p className="text-sm text-[#7A7A72] mt-1">Most recent 50 messages sent from your business.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#7A7A72] border-b border-[#F0EDE6]">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Phone</th>
                  <th className="py-2 pr-4 font-medium">Message</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {smsLogs.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-[#7A7A72] text-sm">No messages yet.</td></tr>
                )}
                {smsLogs.map((l) => (
                  <tr key={l.id} className="border-t border-[#F7F5F0]">
                    <td className="py-2.5 pr-4 text-[#7A7A72] whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-medium">{l.customer_name || "—"}</td>
                    <td className="py-2.5 pr-4 text-[#7A7A72]">{l.customer_phone || "—"}</td>
                    <td className="py-2.5 pr-4 max-w-xs truncate text-[#7A7A72]" title={l.message}>{l.message || "—"}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F5F0] text-[#7A7A72]">{l.message_type}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                        l.status === "sent" ? "bg-[#E8F5F1] text-[#0F6E56]" : "bg-red-50 text-red-600"
                      }`}>{l.status}</span>
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

// ─── Template Editor ─────────────────────────────────────────────────────────
// A friendly editor that shows a live preview with real values instead of {placeholders}

function TemplateEditor({
  label, description, value, onChange, businessName, onTest, previewVars,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  businessName: string;
  onTest: () => void;
  previewVars: { name: string; position: number; wait: number; business: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preview = fillTemplate(value, previewVars);
  const chars = value.length;
  const insertVar = (varKey: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = value.slice(0, start) + varKey + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  return (
    <div className="rounded-xl border border-[#DDD9D0] overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-[#F7F5F0] hover:bg-[#F0EDE6] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#0E0E0C]">{label}</div>
          {!expanded && (
            <div className="text-xs text-[#7A7A72] mt-0.5 truncate">{preview}</div>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-[#7A7A72] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#7A7A72] shrink-0" />}
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-[#DDD9D0]">
          <p className="text-xs text-[#7A7A72]">{description}</p>

          {/* Variable chips — click to insert */}
          <div>
            <div className="rounded-xl bg-[#E8F5F1] border border-[#0F6E56]/20 px-4 py-3 mb-3">
              <p className="text-xs font-semibold text-[#0F6E56] mb-0.5">Translate freely — but protect the special words</p>
              <p className="text-xs text-[#3A6B5A] leading-relaxed">
                Words like <code className="bg-white/70 px-1 rounded font-mono">{"{name}"}</code> and <code className="bg-white/70 px-1 rounded font-mono">{"{position}"}</code> are filled in automatically. Write around them — do not translate or delete them.
              </p>
            </div>
            <div className="text-xs font-medium text-[#7A7A72] mb-2">Click to insert:</div>
            <div className="flex flex-wrap gap-2">
              {VARS.map((v) => (
                <button key={v.key} type="button" onClick={() => insertVar(v.key)}
                  className="inline-flex flex-col items-start px-3 py-1.5 rounded-lg border border-[#0F6E56]/30 bg-[#E8F5F1] hover:bg-[#d4efe8] transition-colors">
                  <span className="text-xs font-semibold text-[#0F6E56]">{v.label}</span>
                  <span className="text-[10px] text-[#7A7A72]">e.g. "{v.example}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              rows={3}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-3 py-2.5 text-sm outline-none focus:border-[#0F6E56] resize-none transition-colors"
            />
            <div className="text-right text-xs mt-1 text-[#7A7A72]">
              {chars} characters
            </div>
            {(value.match(/\{[^}]+\}/g) ?? []).filter(t => !["{name}","{business}","{position}","{wait}"].includes(t)).length > 0 && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                ⚠️ Unknown variable detected: <strong>{(value.match(/\{[^}]+\}/g) ?? []).filter(t => !["{name}","{business}","{position}","{wait}"].includes(t)).join(", ")}</strong> — this will appear as-is in the SMS. Delete it and use the buttons above instead.
              </div>
            )}
          </div>

          {/* Live preview with real values */}
          <div className="rounded-xl border border-[#DDD9D0] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest font-medium text-[#7A7A72]">Preview — how it looks to your customer</div>
              <button type="button" onClick={onTest}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F6E56] hover:text-[#0a5a44] transition-colors">
                <Send className="h-3 w-3" /> Send test SMS
              </button>
            </div>
            <div className="bg-[#F7F5F0] rounded-lg px-4 py-3 text-sm text-[#0E0E0C] leading-relaxed whitespace-pre-wrap">
              {preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="border-b border-[#DDD9D0] pb-4">
      <h2 className="text-xl font-semibold text-[#0E0E0C]">{title}</h2>
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "P";
}
