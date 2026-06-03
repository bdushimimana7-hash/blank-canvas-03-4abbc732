import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PossacLogo } from "@/components/Brand";
import { SECTORS } from "@/lib/sectors";
import { fillTemplate } from "@/lib/format";
import { callSignup } from "@/lib/edge-functions";
import { useSession } from "@/hooks/useSession";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("other");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 — service time
  const [avgServiceMins, setAvgServiceMins] = useState(15);

  // Step 3 — SMS templates (pre-filled with real wait times)
  const makeDefaultAdd = (mins: number) =>
    `Hi {name}, you are number {position} in the queue at {business}. Estimated wait: {wait} minutes. We will alert you when you are close.`;
  const makeDefaultFirst = () =>
    `Hi {name}, you are next in line at {business}. Please come in now or let staff know you have arrived.`;
  const makeDefaultHeadsup = () =>
    `Hi {name}, you are 3rd in line at {business}. Please start making your way back now.`;
  const makeDefaultCall = () =>
    `Hi {name}, it is your turn at {business}. Please come in now.`;

  const [tplAdd, setTplAdd] = useState(makeDefaultAdd(15));
  const [tplFirst, setTplFirst] = useState(makeDefaultFirst());
  const [tplHeadsup, setTplHeadsup] = useState(makeDefaultHeadsup());
  const [tplCall, setTplCall] = useState(makeDefaultCall());

  useEffect(() => { document.title = "Create your account — Possac"; }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (role === "superadmin") navigate("/superadmin");
    else if (role === "owner") navigate("/dashboard");
    else if (role === "staff") navigate("/queue");
  }, [user, role, loading, navigate]);

  // When avgServiceMins changes, update the wait preview variable
  const previewVars = useMemo(
    () => ({
      name: "Jean",
      position: 4,
      wait: avgServiceMins * 3, // example: position 4, so 3 people ahead × service time
      business: businessName.trim() || "your business",
    }),
    [businessName, avgServiceMins],
  );

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setStep(2);
  };

  const goStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-fill templates with the real avg service time
    setTplAdd(makeDefaultAdd(avgServiceMins));
    setStep(3);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await callSignup("signup_owner", {
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        sector,
        email: email.trim(),
        password,
        avg_service_mins: avgServiceMins,
        sms_template_add: tplAdd,
        sms_template_first: tplFirst,
        sms_template_headsup: tplHeadsup,
        sms_template_call: tplCall,
      });
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (signInErr) {
        toast.success("Account created. Please sign in.");
        navigate("/login");
      } else {
        toast.success("Welcome to Possac!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const QUICK_TIMES = [5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="min-h-screen bg-[#F7F5F0] py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 flex justify-center"><PossacLogo /></div>

        <div className="bg-white border border-[#DDD9D0] rounded-2xl shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-[#F0EDE6] flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight text-[#0E0E0C]">
              {step === 1 ? "Create your account" : step === 2 ? "How long does each service take?" : "Your SMS messages"}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#7A7A72]">
              <StepDot n={1} active={step >= 1} done={step > 1} />
              <span className="w-5 h-px bg-[#DDD9D0]" />
              <StepDot n={2} active={step >= 2} done={step > 2} />
              <span className="w-5 h-px bg-[#DDD9D0]" />
              <StepDot n={3} active={step >= 3} done={false} />
            </div>
          </div>

          {/* STEP 1 — Account details */}
          {step === 1 && (
            <form onSubmit={goStep2} className="p-6 space-y-4">
              <Field id="full_name" label="Your full name">
                <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="h-11 rounded-xl border-[#DDD9D0]" />
              </Field>
              <Field id="business_name" label="Business name">
                <Input id="business_name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  className="h-11 rounded-xl border-[#DDD9D0]" />
              </Field>
              <Field id="sector" label="Sector">
                <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-[#DDD9D0] bg-white px-3 py-2 text-sm outline-none focus:border-[#0F6E56]">
                  {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field id="email" label="Email">
                <Input id="email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-[#DDD9D0]" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="password" label="Password">
                  <Input id="password" type="password" required minLength={8} autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border-[#DDD9D0]" />
                </Field>
                <Field id="confirm" label="Confirm password">
                  <Input id="confirm" type="password" required minLength={8} autoComplete="new-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="h-11 rounded-xl border-[#DDD9D0]" />
                </Field>
              </div>
              <Button type="submit" className="w-full h-11 bg-[#0F6E56] hover:bg-[#0a5a44] rounded-xl text-white font-medium">
                Continue →
              </Button>
              <p className="text-xs text-center text-[#7A7A72]">
                Already have an account?{" "}
                <Link to="/login" className="text-[#0F6E56] font-medium">Sign in</Link>
              </p>
            </form>
          )}

          {/* STEP 2 — Service time */}
          {step === 2 && (
            <form onSubmit={goStep3} className="p-6 space-y-6">
              <div className="bg-[#E8F5F1] border border-[#0F6E56]/20 rounded-xl p-4">
                <p className="text-sm font-medium text-[#0F6E56] mb-1">Why we ask this</p>
                <p className="text-xs text-[#0F6E56]/80 leading-relaxed">
                  We use your average service time to calculate accurate wait times in SMS messages.
                  For example, if each customer takes 15 minutes and someone is 4th in queue,
                  we tell them "about 45 minutes" — not a random guess.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-[#0E0E0C] block mb-1">
                  On average, how many minutes does it take to serve one customer?
                </label>
                <p className="text-xs text-[#7A7A72] mb-4">Pick the closest option. You can always change this in Settings.</p>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {QUICK_TIMES.map((t) => (
                    <button type="button" key={t}
                      onClick={() => setAvgServiceMins(t)}
                      className={`h-12 rounded-xl border text-sm font-medium transition-all ${
                        avgServiceMins === t
                          ? "bg-[#0F6E56] text-white border-[#0F6E56] shadow-sm"
                          : "border-[#DDD9D0] text-[#0E0E0C] hover:border-[#0F6E56]/40 hover:bg-[#E8F5F1]"
                      }`}>
                      {t} min
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => {
                      const v = parseInt(prompt("Enter minutes (1–120):") ?? "");
                      if (v >= 1 && v <= 120) setAvgServiceMins(v);
                    }}
                    className="h-12 rounded-xl border border-dashed border-[#DDD9D0] text-xs text-[#7A7A72] hover:border-[#0F6E56]/40">
                    Custom
                  </button>
                </div>

                <div className="bg-[#F7F5F0] border border-[#DDD9D0] rounded-xl p-4">
                  <div className="text-xs text-[#7A7A72] uppercase tracking-widest mb-2">Wait time preview</div>
                  <div className="space-y-1 text-sm text-[#0E0E0C]">
                    <div className="flex justify-between">
                      <span>Customer is 1st in queue</span>
                      <span className="font-medium text-[#0F6E56]">Next up</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer is 2nd in queue</span>
                      <span className="font-medium">{avgServiceMins} min wait</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer is 4th in queue</span>
                      <span className="font-medium">{avgServiceMins * 3} min wait</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer is 8th in queue</span>
                      <span className="font-medium">{avgServiceMins * 7} min wait</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button type="submit" className="flex-[2] h-11 bg-[#0F6E56] hover:bg-[#0a5a44] rounded-xl text-white font-medium">
                  Continue →
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3 — SMS templates */}
          {step === 3 && (
            <form onSubmit={onSubmit} className="p-6 space-y-6">
              <div className="bg-[#F7F5F0] border border-[#DDD9D0] rounded-xl p-4">
                <p className="text-xs text-[#7A7A72] mb-2 font-medium uppercase tracking-widest">Available variables</p>
                <div className="flex flex-wrap gap-2">
                  {["{name}", "{position}", "{business}", "{wait}"].map((v) => (
                    <code key={v} className="px-2 py-0.5 bg-white border border-[#DDD9D0] rounded-lg text-xs text-[#0F6E56] font-mono">{v}</code>
                  ))}
                </div>
                <p className="text-xs text-[#7A7A72] mt-2">
                  <code className="text-[#0F6E56]">{"{wait}"}</code> is calculated automatically based on your {avgServiceMins}-minute service time.
                </p>
              </div>

              <TemplateField
                label="1. When customer joins (any position except 1st)"
                value={tplAdd} onChange={setTplAdd}
                preview={fillTemplate(tplAdd, previewVars)}
              />
              <TemplateField
                label="2. When customer is first in queue (next to be served)"
                value={tplFirst} onChange={setTplFirst}
                preview={fillTemplate(tplFirst, { ...previewVars, position: 1, wait: 0 })}
                note="This fires when they reach position 1. No wait time needed here."
              />
              <TemplateField
                label="3. Heads-up (auto-sent when they reach position 3)"
                value={tplHeadsup} onChange={setTplHeadsup}
                preview={fillTemplate(tplHeadsup, { ...previewVars, position: 3, wait: avgServiceMins * 2 })}
              />
              <TemplateField
                label="4. When it is their turn (staff calls them)"
                value={tplCall} onChange={setTplCall}
                preview={fillTemplate(tplCall, { ...previewVars, position: 1, wait: 0 })}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button type="submit" disabled={submitting} className="flex-[2] h-11 bg-[#0F6E56] hover:bg-[#0a5a44] rounded-xl text-white font-medium">
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

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span className={`h-6 w-6 inline-flex items-center justify-center rounded-full text-[10px] font-semibold border transition-all ${
      done ? "bg-[#0F6E56] text-white border-[#0F6E56]"
      : active ? "bg-[#E8F5F1] text-[#0F6E56] border-[#0F6E56]/30"
      : "bg-[#F7F5F0] text-[#7A7A72] border-[#DDD9D0]"
    }`}>
      {done ? <Check className="h-3 w-3" /> : n}
    </span>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#0E0E0C]">{label}</Label>
      {children}
    </div>
  );
}

function TemplateField({
  label, value, onChange, preview, note,
}: { label: string; value: string; onChange: (v: string) => void; preview: string; note?: string }) {
  const chars = value.length;
  const max = 160;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#0E0E0C]">{label}</label>
        <span className={`text-xs tabular-nums ${chars > max ? "text-red-500" : "text-[#7A7A72]"}`}>{chars}/{max}</span>
      </div>
      {note && <p className="text-xs text-[#7A7A72]">{note}</p>}
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-[#DDD9D0] text-sm resize-none" />
      <div className="rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] px-4 py-3">
        <div className="text-[10px] uppercase tracking-widest text-[#7A7A72] mb-1">Preview</div>
        <div className="text-sm text-[#0E0E0C] leading-relaxed whitespace-pre-wrap">{preview}</div>
      </div>
    </div>
  );
}
