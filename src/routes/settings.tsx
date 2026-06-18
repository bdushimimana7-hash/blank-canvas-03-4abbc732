import { useEffect, useRef, useState, useCallback } from "react";
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
import { ArrowLeft, Send, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface StaffRow { id: string; user_id: string; full_name: string; role: string; }
interface SmsLogRow {
  id: string; customer_name: string; customer_phone: string;
  message: string; message_type: string; status: string; created_at: string;
}

// Canonical variable tokens — these are the ONLY valid ones
const VARS = [
  { key: "{name}",     label: "Customer name", example: "Jean"        },
  { key: "{business}", label: "Business name",  example: "Salon Belle" },
  { key: "{position}", label: "Queue position", example: "3"           },
  { key: "{wait}",     label: "Wait time (min)",example: "15"          },
];
const VAR_KEYS = new Set(VARS.map((v) => v.key));

// Detect any {word} tokens that are NOT valid variable keys
function hasBrokenVars(tpl: string): string[] {
  const found: string[] = [];
  const matches = tpl.match(/\{[^}]+\}/g) ?? [];
  for (const m of matches) {
    if (!VAR_KEYS.has(m)) found.push(m);
  }
  return found;
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
    // Block save if any template has broken variables
    const allTpls = [tplAdd, tplFirst, tplHeadsup, tplCall];
    const allBroken = allTpls.flatMap(hasBrokenVars);
    if (allBroken.length > 0) {
      toast.error(`Fix broken variables before saving: ${[...new Set(allBroken)].join(", ")}`);
      return;
    }
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
            These messages are sent automatically to your customers. Write your text — use the buttons below to insert the parts that change automatically (name, position, etc.).
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

// ─── Template Editor ──────────────────────────────────────────────────────────
//
// Stores template as a plain string with {name} etc.
// Renders a contentEditable div that shows variables as green pill-chips.
// Variables are atomic: you can't type inside them or partially delete them.
// Plain text between variables is freely editable.

// Split a template string into text segments and variable tokens
type Segment = { type: "text"; value: string } | { type: "var"; key: string };

function parseTemplate(tpl: string): Segment[] {
  const segments: Segment[] = [];
  // Split on any {word} token
  const parts = tpl.split(/(\{[^}]+\})/g);
  for (const part of parts) {
    if (!part) continue;
    if (/^\{[^}]+\}$/.test(part)) {
      segments.push({ type: "var", key: part });
    } else {
      segments.push({ type: "text", value: part });
    }
  }
  return segments;
}

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
  const editorRef = useRef<HTMLDivElement>(null);
  // Track whether we're mid-composition (IME input) to avoid clobbering
  const composingRef = useRef(false);
  // Prevent re-reading DOM while we're programmatically updating it
  const suppressRef = useRef(false);

  const preview = fillTemplate(value, previewVars);
  const brokenVars = hasBrokenVars(value);
  const charCount = value.length;

  // Build DOM from the template string value
  const renderToEditor = useCallback((tpl: string) => {
    const el = editorRef.current;
    if (!el) return;
    suppressRef.current = true;

    const segments = parseTemplate(tpl);
    // Save cursor position by finding which text node + offset we're at
    // We rebuild the DOM and restore the cursor after
    el.innerHTML = "";
    for (const seg of segments) {
      if (seg.type === "text") {
        el.appendChild(document.createTextNode(seg.value));
      } else {
        const isValid = VAR_KEYS.has(seg.key);
        const chip = document.createElement("span");
        chip.setAttribute("data-var", seg.key);
        chip.setAttribute("contenteditable", "false");
        chip.textContent = VARS.find((v) => v.key === seg.key)?.label ?? seg.key;
        chip.className = isValid
          ? "inline-flex items-center mx-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0F6E56] text-white select-none cursor-default"
          : "inline-flex items-center mx-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 select-none cursor-default";
        el.appendChild(chip);
      }
    }
    // Ensure there's always a trailing text node so cursor can be placed at end
    const last = el.lastChild;
    if (!last || last.nodeType !== Node.TEXT_NODE) {
      el.appendChild(document.createTextNode(""));
    }

    suppressRef.current = false;
  }, []);

  // Read the DOM back into a template string
  const readFromEditor = useCallback((): string => {
    const el = editorRef.current;
    if (!el) return value;
    let result = "";
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent ?? "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const varKey = el.getAttribute("data-var");
        if (varKey) {
          result += varKey; // write back the {name} token, not the display label
        }
        // ignore any other elements (browser may insert <br> etc.)
      }
    }
    return result;
  }, [value]);

  // When value prop changes from outside (initial load), re-render
  useEffect(() => {
    if (!expanded) return;
    renderToEditor(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Update when value changes externally (e.g. initial DB load)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value && expanded && !suppressRef.current) {
      renderToEditor(value);
    }
    prevValueRef.current = value;
  }, [value, expanded, renderToEditor]);

  const handleInput = useCallback(() => {
    if (suppressRef.current || composingRef.current) return;
    const newVal = readFromEditor();
    if (newVal !== value) onChange(newVal);
  }, [readFromEditor, onChange, value]);

  // Insert a variable at the current cursor position
  const insertVar = useCallback((varKey: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Delete selection if any
      range.deleteContents();

      // Build the chip
      const chip = document.createElement("span");
      chip.setAttribute("data-var", varKey);
      chip.setAttribute("contenteditable", "false");
      chip.textContent = VARS.find((v) => v.key === varKey)?.label ?? varKey;
      chip.className = "inline-flex items-center mx-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0F6E56] text-white select-none cursor-default";

      // Insert chip, then a zero-width text node after it for cursor
      range.insertNode(document.createTextNode("\u200B")); // zero-width space placeholder, will be overwritten
      range.insertNode(chip);

      // Move cursor after the chip
      const newRange = document.createRange();
      newRange.setStartAfter(chip);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    const newVal = readFromEditor();
    onChange(newVal);
  }, [readFromEditor, onChange]);

  // Handle keydown: intercept Backspace/Delete near chip boundaries
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return; // let browser handle selection deletion

    if (e.key === "Backspace") {
      // Check if the node immediately before cursor is a chip
      let node: Node | null = range.startContainer;
      let offset = range.startOffset;
      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        node = node.previousSibling;
        offset = -1;
      } else if (node.nodeType === Node.TEXT_NODE) {
        return; // normal text deletion, let browser handle
      } else {
        // cursor is in element node
        node = (node as Element).childNodes[offset - 1] ?? null;
      }
      if (node && (node as HTMLElement).getAttribute?.("data-var")) {
        e.preventDefault();
        node.parentNode?.removeChild(node);
        const newVal = readFromEditor();
        onChange(newVal);
      }
    } else if (e.key === "Delete") {
      let node: Node | null = range.startContainer;
      let offset = range.startOffset;
      if (node.nodeType === Node.TEXT_NODE && offset === node.textContent!.length) {
        node = node.nextSibling;
      } else if (node.nodeType === Node.TEXT_NODE) {
        return;
      } else {
        node = (node as Element).childNodes[offset] ?? null;
      }
      if (node && (node as HTMLElement).getAttribute?.("data-var")) {
        e.preventDefault();
        node.parentNode?.removeChild(node);
        const newVal = readFromEditor();
        onChange(newVal);
      }
    }
  }, [readFromEditor, onChange]);

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
            <div className="text-xs font-medium text-[#0E0E0C] mb-1">
              Insert a variable — click to add it to your message:
            </div>
            <p className="text-xs text-[#7A7A72] mb-2">
              These are replaced automatically when the SMS is sent. Do not type them manually.
            </p>
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

          {/* Rich-text editor div */}
          <div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; handleInput(); }}
              className="w-full min-h-[72px] rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-3 py-2.5 text-sm outline-none focus:border-[#0F6E56] transition-colors leading-7 whitespace-pre-wrap break-words"
              style={{ wordBreak: "break-word" }}
            />
            {/* Character count — no split warning */}
            <div className="text-right text-xs mt-1 text-[#7A7A72]">
              {charCount} characters
            </div>
          </div>

          {/* Broken variable warning */}
          {brokenVars.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-amber-700">Unknown variable detected</div>
                <div className="text-xs text-amber-600 mt-0.5">
                  {brokenVars.join(", ")} will not be replaced — it will appear as-is in the SMS.
                  Delete it and use the buttons above to insert the correct variable.
                </div>
              </div>
            </div>
          )}

          {/* Live preview */}
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
