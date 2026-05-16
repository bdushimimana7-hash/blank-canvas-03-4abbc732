import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PossacLogo } from "@/components/Brand";
import { SECTORS } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { signupOwner } from "@/lib/signup.functions";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/useSession";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create your account — Possac" }] }),
});

const DEFAULT_ADD =
  "Hi {name}, you are number {position} in the queue at {business}. Estimated wait: {wait} minutes. We will alert you when you are close.";
const DEFAULT_HEADSUP =
  "Hi {name}, you are 3rd in line at {business}. Please start making your way back now.";
const DEFAULT_CALL =
  "Hi {name}, it is your turn at {business}. Please come in now.";

function SignupPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useSession();
  const signupFn = useServerFn(signupOwner);

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("other");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [tplAdd, setTplAdd] = useState(DEFAULT_ADD);
  const [tplHeadsup, setTplHeadsup] = useState(DEFAULT_HEADSUP);
  const [tplCall, setTplCall] = useState(DEFAULT_CALL);

  useEffect(() => {
    if (loading || !user) return;
    if (role === "superadmin") navigate({ to: "/superadmin" });
    else if (role === "owner") navigate({ to: "/dashboard" });
    else if (role === "staff") navigate({ to: "/queue" });
  }, [user, role, loading, navigate]);

  const previewVars = useMemo(
    () => ({ name: "Jean", position: 6, wait: 45, business: businessName.trim() || "your business" }),
    [businessName],
  );

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signupFn({
        data: {
          full_name: fullName.trim(),
          business_name: businessName.trim(),
          sector,
          email: email.trim(),
          password,
          sms_template_add: tplAdd,
          sms_template_headsup: tplHeadsup,
          sms_template_call: tplCall,
        },
      });
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (signInErr) {
        toast.success("Account created. Please sign in.");
        navigate({ to: "/login" });
      } else {
        toast.success("Welcome to Possac");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 flex justify-center"><PossacLogo /></div>

        <div className="bg-card border rounded-xl shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight">
              {step === 1 ? "Create your account" : "Customize your SMS messages"}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <StepDot active={step >= 1} done={step > 1} /> 
              <span className="w-6 h-px bg-border" />
              <StepDot active={step >= 2} done={false} />
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={goStep2} className="p-6 space-y-4">
              <Field id="full_name" label="Your full name">
                <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field id="business_name" label="Business name">
                <Input id="business_name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </Field>
              <Field id="sector" label="Sector">
                <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field id="email" label="Email">
                <Input id="email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="password" label="Password">
                  <Input id="password" type="password" required minLength={8} autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Field id="confirm" label="Confirm password">
                  <Input id="confirm" type="password" required minLength={8} autoComplete="new-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" className="w-full h-11">Continue</Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium">Sign in</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">
                These messages are sent automatically. Use{" "}
                <code className="px-1 bg-muted rounded text-xs">{`{name}`}</code>,{" "}
                <code className="px-1 bg-muted rounded text-xs">{`{position}`}</code>,{" "}
                <code className="px-1 bg-muted rounded text-xs">{`{business}`}</code>,{" "}
                <code className="px-1 bg-muted rounded text-xs">{`{wait}`}</code>.
              </p>

              <TemplateField
                label="1. When a customer joins the queue"
                value={tplAdd} onChange={setTplAdd}
                preview={fillTemplate(tplAdd, previewVars)}
              />
              <TemplateField
                label="2. Heads-up (auto-sent at position 3)"
                value={tplHeadsup} onChange={setTplHeadsup}
                preview={fillTemplate(tplHeadsup, previewVars)}
              />
              <TemplateField
                label="3. When it is their turn"
                value={tplCall} onChange={setTplCall}
                preview={fillTemplate(tplCall, previewVars)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button type="submit" disabled={submitting} className="flex-[2] h-11">
                  {submitting ? "Creating account…" : "Finish & open dashboard"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span className={`h-5 w-5 inline-flex items-center justify-center rounded-full text-[10px] font-semibold border ${
      done ? "bg-primary text-primary-foreground border-primary"
      : active ? "bg-primary/10 text-primary border-primary/30"
      : "bg-muted text-muted-foreground border-border"
    }`}>
      {done ? <Check className="h-3 w-3" /> : active ? "•" : ""}
    </span>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function TemplateField({
  label, value, onChange, preview,
}: { label: string; value: string; onChange: (v: string) => void; preview: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="rounded-md border border-dashed bg-muted/40 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
        <div className="text-sm mt-0.5 whitespace-pre-wrap">{preview}</div>
      </div>
    </div>
  );
}
