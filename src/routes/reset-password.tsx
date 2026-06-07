import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { PossacLogo } from "@/components/Brand";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { document.title = "Reset password — Possac"; }, []);

  useEffect(() => {
    // Check for error in URL hash (expired/invalid link)
    const hash = window.location.hash;
    if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
      setExpired(true);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated successfully.");
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8"><PossacLogo /></Link>
      <div className="w-full max-w-[380px]">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">

          {expired ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h1 className="text-[18px] font-semibold text-[#111827]">Link expired</h1>
              <p className="text-sm text-[#6B7280] mt-2">
                This password reset link has expired or already been used. Request a new one from the sign in page.
              </p>
              <Link to="/login"
                className="mt-5 w-full h-10 bg-[#0F6E56] text-white rounded-full font-medium text-sm hover:bg-[#0D5E49] transition-colors flex items-center justify-center">
                Back to sign in
              </Link>
            </>
          ) : !ready ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-5 w-5 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin" />
                <span className="text-sm text-[#6B7280]">Verifying reset link…</span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Make sure you opened this page directly from the email link.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[18px] font-semibold tracking-tight text-[#111827]">Set new password</h1>
              <p className="text-sm text-[#6B7280] mt-1">Choose a strong password for your account.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#374151]">New password</label>
                  <input type="password" required minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#374151]">Confirm password</label>
                  <input type="password" required minLength={8} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Same password again"
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-[#0F6E56] text-white h-10 rounded-full font-medium text-sm hover:bg-[#0D5E49] transition-colors disabled:opacity-60">
                  {submitting ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}