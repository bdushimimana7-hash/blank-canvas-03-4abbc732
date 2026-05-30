import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PossacLogo } from "@/components/Brand";

interface BizInfo { id: string; name: string }

export default function JoinPage() {
  const { businessId = "" } = useParams();
  const navigate = useNavigate();
  const [biz, setBiz] = useState<BizInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      // Anti-duplicate: if recently joined this business, send to status
      try {
        const raw = localStorage.getItem(`possac:join:${businessId}`);
        if (raw) {
          const obj = JSON.parse(raw) as { entryId: string; at: number };
          if (Date.now() - obj.at < 3 * 60 * 60 * 1000 && obj.entryId) {
            navigate(`/status/${obj.entryId}`, { replace: true });
            return;
          }
        }
      } catch { /* ignore */ }

      const { data, error } = await supabase.functions.invoke("public-queue", {
        body: { action: "business", data: { businessId } },
      });
      if (error || (data as { error?: string })?.error) {
        setError((data as { error?: string })?.error ?? error?.message ?? "Business not found");
      } else {
        const b = data as BizInfo;
        setBiz(b);
        document.title = `Join the queue — ${b.name}`;
      }
      setLoading(false);
    })();
  }, [businessId, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("public-queue", {
      body: { action: "join", data: { businessId, name: name.trim(), phone: phone.trim() } },
    });
    const payload = data as { entryId?: string; error?: string };
    if (error || payload?.error || !payload?.entryId) {
      setError(payload?.error ?? error?.message ?? "Could not join the queue. Please try again.");
      setSubmitting(false);
      return;
    }
    try {
      localStorage.setItem(
        `possac:join:${businessId}`,
        JSON.stringify({ entryId: payload.entryId, at: Date.now() }),
      );
    } catch { /* ignore */ }
    navigate(`/status/${payload.entryId}`, { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!biz) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Queue unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2">{error ?? "This business is not accepting customers right now."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex justify-center mb-6"><PossacLogo /></div>
        <h1 className="text-2xl font-semibold tracking-tight text-center">{biz.name}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Join the queue from your phone.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name or nickname</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              className="h-12 text-base" placeholder="Your name" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
              inputMode="tel" className="h-12 text-base" placeholder="07XXXXXXXX — optional" />
            <p className="text-xs text-muted-foreground">Optional. Only used to notify you when it's your turn.</p>
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-14 text-base">
            {submitting ? "Joining…" : "Join the queue"}
          </Button>
        </form>
      </div>
    </div>
  );
}