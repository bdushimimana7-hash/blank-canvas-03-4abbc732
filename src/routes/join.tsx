import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PossacLogo } from "@/components/Brand";
import { CheckCircle2, Store } from "lucide-react";

interface BizInfo { id: string; name: string; queueSize?: number; waiting?: number; currentWaiting?: number }
interface JoinSuccess { entryId: string; position: number; waitMinutes: number }

export default function JoinPage() {
  const { businessId = "" } = useParams();
  const navigate = useNavigate();
  const [biz, setBiz] = useState<BizInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<JoinSuccess | null>(null);

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
    const payload = data as { entryId?: string; position?: number; waitMinutes?: number; error?: string };
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
    let statusPayload: { position?: number; waitMinutes?: number } = {};
    try {
      const { data: statusData } = await supabase.functions.invoke("public-queue", {
        body: { action: "status", data: { entryId: payload.entryId } },
      });
      statusPayload = (statusData ?? {}) as { position?: number; waitMinutes?: number };
    } catch { /* status page will continue polling */ }
    setSuccess({
      entryId: payload.entryId,
      position: payload.position ?? statusPayload.position ?? 1,
      waitMinutes: payload.waitMinutes ?? statusPayload.waitMinutes ?? 0,
    });
    setSubmitting(false);
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

  if (success) {
    return (
      <div className="route-fade min-h-screen bg-[#F7F5F0] px-5 py-8">
        <div className="mx-auto max-w-md">
          <div className="flex justify-center mb-8"><PossacLogo /></div>
          <div className="rounded-[28px] border border-[#DDD9D0] bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#0F6E56]" />
            <h1 className="font-display mt-5 text-3xl font-bold text-[#0E0E0C]">You're in!</h1>
            <p className="mt-2 text-sm leading-6 text-[#7A7A72]">Go about your day — we'll text you when you're close.</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#E8F5F1] p-4">
                <div className="text-xs text-[#7A7A72]">Position</div>
                <div className="font-display text-4xl font-extrabold text-[#0F6E56]">#{success.position}</div>
              </div>
              <div className="rounded-2xl bg-[#F7F5F0] p-4">
                <div className="text-xs text-[#7A7A72]">Estimated wait</div>
                <div className="font-display text-4xl font-extrabold text-[#0E0E0C]">{success.waitMinutes}<span className="text-base">m</span></div>
              </div>
            </div>
            <Button onClick={() => navigate(`/status/${success.entryId}`, { replace: true })} className="shine-hover mt-7 h-12 w-full rounded-xl">
              View my place in line
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const queueSize = biz.currentWaiting ?? biz.waiting ?? biz.queueSize ?? 0;

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0]">
      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex justify-center mb-6"><PossacLogo /></div>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F6E56] text-white shadow-lg shadow-[#0F6E56]/20">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-[#0E0E0C]">{biz.name}</h1>
          <p className="mt-2 text-sm font-medium text-[#0F6E56]">{queueSize} people currently waiting</p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#7A7A72]">You won't need to stay here — we'll SMS you when it's your turn.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-[28px] border border-[#DDD9D0] bg-white p-5 shadow-sm">
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
            <div className="flex h-12 items-center rounded-md border border-input bg-background px-3 focus-within:border-[#0F6E56]">
              <span className="mr-2 text-lg">🇷🇼</span>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                inputMode="tel" className="h-full flex-1 bg-transparent text-base outline-none" placeholder="07X XXX XXXX" />
            </div>
            <p className="text-xs text-muted-foreground">Optional. Only used to notify you when it's your turn.</p>
          </div>
          <Button type="submit" disabled={submitting} className="shine-hover w-full h-14 rounded-xl text-base">
            {submitting ? "Joining…" : "Join the queue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
