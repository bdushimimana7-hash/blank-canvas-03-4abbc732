import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PossacLogo } from "@/components/Brand";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
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

  useEffect(() => {
    callSignup("ensure_seed_superadmin").catch(() => {});
  }, []);

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
      const { data: sp } = await supabase
        .from("staff_profiles")
        .select("businesses(active)")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();
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
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setSendingReset(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password reset link sent. Check your email.");
      setShowForgot(false);
      setForgotEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <PossacLogo />
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your queue from any device.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true); }}
                  className="text-xs text-primary font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input id="password" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          {showForgot && (
            <form onSubmit={onForgot} className="mt-6 pt-6 border-t space-y-3">
              <Label htmlFor="forgot">Reset your password</Label>
              <Input id="forgot" type="email" required placeholder="you@example.com"
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" disabled={sendingReset} className="flex-1" variant="secondary">
                  {sendingReset ? "Sending…" : "Send reset link"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForgot(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
        <p className="text-sm text-center text-muted-foreground mt-6">
          New to Possac?{" "}
          <Link to="/signup" className="text-primary font-medium">Create your account</Link>
        </p>
      </div>
    </div>
  );
}