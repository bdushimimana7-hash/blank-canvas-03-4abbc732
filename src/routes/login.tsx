import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: window.location.origin + "/reset-password" });
    setSendingReset(false);
    if (error) toast.error(error.message);
    else { toast.success("Password reset link sent. Check your email."); setShowForgot(false); setForgotEmail(""); }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8"><PossacLogo /></Link>
      <div className="w-full max-w-[380px]">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
          <h1 className="text-[18px] font-semibold tracking-tight text-[#111827]">Welcome back</h1>
          <p className="text-sm text-[#6B7280] mt-1">Sign in to manage your queue.</p>

          {!showForgot ? (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#374151]">Email</label>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#374151]">Password</label>
                  <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true); }}
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
          ) : (
            <form onSubmit={onForgot} className="mt-6 space-y-4">
              <p className="text-sm text-[#6B7280]">Enter your email and we&apos;ll send you a reset link.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#374151]">Email</label>
                <input type="email" required placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={sendingReset}
                  className="flex-1 bg-[#0F6E56] text-white h-10 rounded-full font-medium text-sm hover:bg-[#0D5E49] transition-colors disabled:opacity-60">
                  {sendingReset ? "Sending…" : "Send reset link"}
                </button>
                <button type="button" onClick={() => setShowForgot(false)}
                  className="px-4 h-10 border border-[#E5E7EB] rounded-full text-sm text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-sm text-center text-[#6B7280] mt-5">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-[#0F6E56] font-medium hover:underline">Start for free</Link>
        </p>
      </div>
    </div>
  );
}
