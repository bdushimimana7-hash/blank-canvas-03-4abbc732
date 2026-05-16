import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTORS } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { inviteStaff, removeStaff } from "@/lib/admin.functions";
import { ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Possac" }] }),
});

interface StaffRow { id: string; user_id: string; full_name: string; role: string; }

function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading, businessId, role } = useSession();
  const [name, setName] = useState("");
  const [sector, setSector] = useState("other");
  const [tplAdd, setTplAdd] = useState("");
  const [tplHeadsup, setTplHeadsup] = useState("");
  const [tplCall, setTplCall] = useState("");
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Invite form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);

  const inviteStaffFn = useServerFn(inviteStaff);
  const removeStaffFn = useServerFn(removeStaff);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (role === "staff") navigate({ to: "/queue" });
  }, [user, loading, role, navigate]);

  const reload = async () => {
    if (!businessId) return;
    const { data: biz } = await supabase
      .from("businesses").select("name, sector, sms_template_add, sms_template_headsup, sms_template_call").eq("id", businessId).single();
    if (biz) {
      setName(biz.name); setSector(biz.sector);
      setTplAdd(biz.sms_template_add);
      setTplHeadsup(biz.sms_template_headsup);
      setTplCall(biz.sms_template_call);
    }
    const { data: sp } = await supabase
      .from("staff_profiles").select("id, user_id, full_name, role").eq("business_id", businessId);
    setStaff((sp ?? []) as StaffRow[]);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [businessId]);

  const save = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase.from("businesses")
      .update({ name, sector, sms_template_add: tplAdd, sms_template_headsup: tplHeadsup, sms_template_call: tplCall })
      .eq("id", businessId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setInviting(true);
    try {
      await inviteStaffFn({ data: {
        business_id: businessId, full_name: inviteName, email: inviteEmail, password: invitePassword,
      }});
      toast.success("Staff added");
      setInviteName(""); setInviteEmail(""); setInvitePassword("");
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setInviting(false); }
  };

  const onRemove = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    try {
      await removeStaffFn({ data: { staff_profile_id: id } });
      toast.success("Removed");
      reload();
    } catch (err) { toast.error((err as Error).message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <PossacLogo />
          <Link to="/dashboard" className="text-sm inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold">Business</h2>
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

        <section className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold">SMS templates</h2>
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
            <TemplateField id="tpla" label="1. When customer joins"
              value={tplAdd} onChange={setTplAdd} business={name} />
            <TemplateField id="tplh" label="2. Heads-up (auto-sent at position 3)"
              value={tplHeadsup} onChange={setTplHeadsup} business={name} />
            <TemplateField id="tplc" label="3. When customer is called"
              value={tplCall} onChange={setTplCall} business={name} />
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>

        <section className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold">Staff</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Staff can only access the queue screens.
          </p>
          <ul className="mt-4 divide-y border rounded-md">
            {staff.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">No staff yet.</li>
            )}
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="text-sm font-medium">{s.full_name || "(unnamed)"}</div>
                  <div className="text-xs text-muted-foreground capitalize">{s.role}</div>
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
      </main>
    </div>
  );
}

function TemplateField({ id, label, value, onChange, business }: {
  id: string; label: string; value: string; onChange: (v: string) => void; business: string;
}) {
  const preview = fillTemplate(value, {
    name: "Jean", position: 6, wait: 45, business: business || "your business",
  });
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
        <div className="text-sm mt-1 whitespace-pre-wrap">{preview}</div>
      </div>
    </div>
  );
}
