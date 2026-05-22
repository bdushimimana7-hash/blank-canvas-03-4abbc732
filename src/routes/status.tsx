import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PossacLogo } from "@/components/Brand";

interface StatusData {
  entryId: string;
  name: string;
  status: "waiting" | "called" | "served" | "no_show" | string;
  position: number;
  ahead: number;
  waitMinutes: number;
  businessName: string;
}

export default function StatusPage() {
  const { entryId = "" } = useParams();
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: res, error } = await supabase.functions.invoke("public-queue", {
      body: { action: "status", data: { entryId } },
    });
    const payload = res as StatusData & { error?: string };
    if (error || payload?.error) {
      setError(payload?.error ?? error?.message ?? "Could not load your status");
      return;
    }
    setData(payload);
    if (payload?.businessName) document.title = `${payload.businessName} — your place in line`;
  }, [entryId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    // Auto-update: poll every 3s + realtime hint (RLS may block, so polling is the source of truth)
    const interval = window.setInterval(refresh, 3000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Status unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const isCalled = data.status === "called";
  const isServed = data.status === "served";
  const isNoShow = data.status === "no_show";

  return (
    <div className="min-h-screen bg-background">
      {isCalled && (
        <div className="w-full bg-info text-info-foreground px-5 py-5 text-center text-base font-semibold">
          It's your turn — please come in now
        </div>
      )}
      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex justify-center mb-6"><PossacLogo /></div>
        <h1 className="text-xl font-semibold tracking-tight text-center">{data.businessName}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Hi {data.name}</p>

        <div className="mt-8 bg-card border rounded-xl p-6 text-center">
          <StatusBadge status={data.status} />
          {!isServed && !isNoShow && (
            <>
              <div className="mt-5 text-sm text-muted-foreground uppercase tracking-wider">You are</div>
              <div className="mt-1 text-5xl font-semibold tabular-nums">#{data.position}</div>
              <div className="mt-1 text-sm text-muted-foreground">in the queue</div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">People ahead</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{data.ahead}</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Est. wait</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {data.waitMinutes}<span className="text-sm font-medium text-muted-foreground ml-1">min</span>
                  </div>
                </div>
              </div>
            </>
          )}
          {isServed && (
            <p className="mt-4 text-sm text-muted-foreground">You've been served. Thank you!</p>
          )}
          {isNoShow && (
            <p className="mt-4 text-sm text-muted-foreground">You were marked as a no-show. Please ask staff to add you again if needed.</p>
          )}
        </div>
        <p className="mt-6 text-xs text-muted-foreground text-center">This page updates automatically.</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Waiting", cls: "bg-accent text-accent-foreground" },
    called: { label: "Called", cls: "bg-info text-info-foreground" },
    served: { label: "Served", cls: "bg-success text-success-foreground" },
    no_show: { label: "No-show", cls: "bg-muted text-muted-foreground" },
  };
  const v = map[status] ?? map.waiting;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${v.cls}`}>
      {v.label}
    </span>
  );
}