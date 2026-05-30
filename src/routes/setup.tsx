import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callSignup } from "@/lib/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PossacLogo } from "@/components/Brand";
import { toast } from "sonner";

export default function SetupPage() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Setup — Possac"; }, []);

  useEffect(() => {
    callSignup<{ exists: boolean }>("superadmin_exists")
      .then((r) => setAvailable(!r.exists))
      .catch(() => setAvailable(false));
  }, []);

  if (available === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking…</div>;
  }
  if (!available) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <PossacLogo className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Setup is already complete.</p>
          <button onClick={() => navigate("/login")} className="mt-4 text-sm text-primary font-medium">Go to sign in →</button>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await callSignup("bootstrap_superadmin", { email, password });
      toast.success("Superadmin created. You can now sign in.");
      navigate("/login");
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><PossacLogo /></div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Create superadmin</h1>
          <p className="text-sm text-muted-foreground mt-1">One-time setup. This account manages all businesses.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Password (min 8 chars)</Label>
              <Input id="p" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11">{busy ? "Creating…" : "Create superadmin"}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}