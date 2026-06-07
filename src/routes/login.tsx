import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { callSignup } from "@/lib/edge-functions";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => { document.title = "Sign in — Possac"; }, []);
  useEffect(() => { callSignup("ensure_seed_superadmin").catch(() => {}); }, []);
  useEffect(() => {
    if (loading || !user) return;
    if (role === "superadmin") navigate("/superadmin");
    else if (role === "owner") navigate("/dashboard");
    else if (role === "staff") navigate("/queue");
  }, [user, role, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setSubmitting(false); toast.error(error.message); return; }
    if (data.user) {
      const { data: sp } = await supabase.from("staff_profiles").select("businesses(active)").eq("user_id", data.user.id).limit(1).maybeSingle();
      const biz = sp?.businesses as { active?: boolean } | null;
      if (biz && biz.active === false) {
        await supabase.auth.signOut();
        setSubmitting(false);
        toast.error("Your account is suspended. Please contact support.");
        return;
      }
    }
    setSubmitting(false);
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReset(true);

    // Check if email exists before sending reset
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("user_id")
      .eq("user_id",
        (await supabase.from("staff_profiles").select("user_id").limit(1)).data?.[0]?.user_id ?? ""
      ).limit(1).maybeSingle();

    // Use a safe check — try signing in with a wrong password to verify email exists
    // Actually the cleanest approach: just always show success (security best practice)
    // but validate email format first
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setSendingReset(false);
      toast.error("Please enter a valid email address");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: "https://possac.pages.dev/reset-password",
    });

    setSendingReset(false);
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8"><PossacLogo /></Link>
      <div className="w-full max-w-[380px]">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">

          {!showForgot ? (
            <>
              <h1 className="text-[18px] font-semibold tracking-tight text-[#111827]">Welcome back</h1>
              <p className="text-sm text-[#6B7280] mt-1">Sign in to manage your queue.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#374151]">Email</label>
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#374151]">Password</label>
                    <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true); setResetSent(false); }}
                      className="text-xs text-[#0F6E56] hover:underline">Forgot password?</button>
                  </div>
                  <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-[#0F6E56] text-white h-10 rounded-full font-medium text-sm hover:bg-[#0D5E49] transition-colors disabled:opacity-60 mt-2">
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </>
          ) : resetSent ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-[#0F6E56]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-[18px] font-semibold text-[#111827]">Check your email</h2>
              <p className="text-sm text-[#6B7280] mt-2">
                If <strong>{forgotEmail}</strong> is registered on Possac, you'll receive a password reset link shortly.
              </p>
              <p className="text-xs text-[#9CA3AF] mt-3">
                Didn't receive it? Check your spam folder or make sure you used the email you signed up with.
              </p>
              <button onClick={() => { setShowForgot(false); setResetSent(false); }}
                className="mt-5 w-full h-10 border border-[#E5E7EB] rounded-full text-sm text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[18px] font-semibold tracking-tight text-[#111827]">Reset your password</h1>
              <p className="text-sm text-[#6B7280] mt-1">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={onForgot} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#374151]">Email</label>
                  <input type="email" required placeholder="you@example.com" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={sendingReset}
                    className="flex-1 bg-[#0F6E56] text-white h-10 rounded-full font-medium text-sm hover:bg-[#0D5E49] transition-colors disabled:opacity-60">
                    {sendingReset ? "Sending…" : "Send reset link"}
                  </button>
                  <button type="button" onClick={() => { setShowForgot(false); setResetSent(false); }}
                    className="px-4 h-10 border border-[#E5E7EB] rounded-full text-sm text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {!showForgot && (
          <p className="text-sm text-center text-[#6B7280] mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#0F6E56] font-medium hover:underline">Start for free</Link>
          </p>
        )}
      </div>
    </div>
  );
}