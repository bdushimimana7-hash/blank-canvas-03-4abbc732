import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PossacLogo } from "@/components/Brand";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { ensureSeedSuperadmin } from "@/lib/signup.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Possac" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const seedFn = useServerFn(ensureSeedSuperadmin);

  useEffect(() => {
    seedFn().catch(() => {});
  }, [seedFn]);

  useEffect(() => {
    if (loading || !user) return;
    if (role === "superadmin") navigate({ to: "/superadmin" });
    else if (role === "owner") navigate({ to: "/dashboard" });
    else if (role === "staff") navigate({ to: "/queue" });
  }, [user, role, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) toast.error(error.message);
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
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
        <p className="text-sm text-center text-muted-foreground mt-6">
          New to Possac?{" "}
          <Link to="/signup" className="text-primary font-medium">Create your account</Link>
        </p>
      </div>
    </div>
  );
}
