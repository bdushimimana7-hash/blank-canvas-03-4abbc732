import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { PossacLogo } from "@/components/Brand";

interface StatusData {
  entryId: string;
  name: string;
  status: "waiting" | "called" | "served" | "no_show" | string;
  position: number;       // original join position (doesn't change)
  livePosition: number;   // current live position (updates as queue moves)
  ahead: number;          // legacy live waiting count from the API
  totalWaiting: number;   // total people currently waiting
  waitMinutes: number;    // calculated: ahead × avg_service_mins
  businessName: string;
}

export default function StatusPage() {
  const { entryId = "" } = useParams();
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushbackError, setPushbackError] = useState<string | null>(null);
  const [pushbackDone, setPushbackDone] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calledPulse, setCalledPulse] = useState(false);
  const lastStatus = useRef<string | null>(null);
  const touchStart = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (removed) return;
    const { data: res, error } = await supabase.functions.invoke("public-queue", {
      body: { action: "status", data: { entryId } },
    });
    const payload = res as StatusData & { error?: string };
    if (error || payload?.error) {
      setError(payload?.error ?? error?.message ?? "Could not load your status");
      return;
    }
    setData(payload);
    if (payload.status === "called" && lastStatus.current && lastStatus.current !== "called") {
      setCalledPulse(true);
      window.setTimeout(() => setCalledPulse(false), 3000);
    }
    lastStatus.current = payload.status;
    if (payload?.businessName) document.title = `${payload.businessName} — your place in line`;
  }, [entryId, removed]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const interval = window.setInterval(refresh, 3000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) touchStart.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStart.current == null) return;
      const diff = e.changedTouches[0].clientY - touchStart.current;
      touchStart.current = null;
      if (diff > 70 && window.scrollY === 0) refresh();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [refresh]);

  const sharePosition = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handlePushback = async () => {
    setActionLoading(true);
    setPushbackError(null);
    const { data: res, error } = await supabase.functions.invoke("public-queue", {
      body: { action: "pushback", data: { entryId } },
    });
    setActionLoading(false);
    let message = (res as any)?.error ?? error?.message;
    const context = (error as any)?.context;
    if (context && typeof context.json === "function") {
      try {
        const body = await context.json();
        message = body?.error ?? message;
      } catch {
        // Keep the Supabase error message if the response body is not JSON.
      }
    }
    if (message) {
      setPushbackError(message);
      return;
    }
    setPushbackDone(true);
    refresh();
  };

  const handleRemove = async () => {
    setRemoving(true);
    const { data: res, error } = await supabase.functions.invoke("public-queue", {
      body: { action: "remove", data: { entryId } },
    });
    setRemoving(false);
    if (error || (res as any)?.error) return;
    setRemoved(true);
    setShowRemoveConfirm(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center bg-[#F7F5F0]">
        <div>
          <h1 className="text-xl font-semibold text-[#0E0E0C]">Status unavailable</h1>
          <p className="text-sm text-[#7A7A72] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="h-5 w-5 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (removed) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center px-5 text-center">
        <PossacLogo className="mb-8" />
        <div className="bg-white border border-[#DDD9D0] rounded-2xl p-8 max-w-sm w-full shadow-sm">
          <div className="h-12 w-12 rounded-full bg-[#F7F5F0] flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#0E0E0C] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            You've left the queue
          </h2>
          <p className="text-sm text-[#7A7A72]">You can rejoin anytime by scanning the QR code at {data.businessName}.</p>
        </div>
      </div>
    );
  }

  const isCalled  = data.status === "called";
  const isServed  = data.status === "served";
  const isNoShow  = data.status === "no_show";
  const isWaiting = data.status === "waiting";

  // Use livePosition if available, fall back to position
  const displayPosition = data.livePosition ?? data.position;
  const displayAhead = Math.max(0, displayPosition - 1);
  const totalInQueue = Math.max(displayPosition, data.totalWaiting ?? displayPosition);
  const progressPct = totalInQueue > 0
    ? Math.max(8, Math.min(98, ((totalInQueue - displayAhead) / totalInQueue) * 100))
    : 50;

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0]">
      {calledPulse && (
        <div className="fixed inset-0 z-[80] pointer-events-none">
          <div className="absolute inset-0 bg-[#0F6E56]/30 animate-ping" />
        </div>
      )}

      {isCalled && (
        <div className="w-full bg-[#0F6E56] text-white px-5 py-4 text-center text-sm font-semibold">
          It's your turn — please come in now
        </div>
      )}

      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex justify-center mb-6"><PossacLogo /></div>
        <h1 className="text-xl font-semibold tracking-tight text-center text-[#0E0E0C]"
          style={{ fontFamily: "'Syne', sans-serif" }}>{data.businessName}</h1>
        <p className="text-sm text-[#7A7A72] text-center mt-1">Hi {data.name}</p>

        {/* Main card */}
        <div className="mt-6 bg-white border border-[#DDD9D0] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-center mb-4"><StatusBadge status={data.status} /></div>

          {!isServed && !isNoShow && (
            <>
              {isCalled ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🟢</div>
                  <p className="text-lg font-bold text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>
                    It's your turn!
                  </p>
                  <p className="text-sm text-[#7A7A72] mt-1">Please come in now. Staff is ready for you.</p>
                </div>
              ) : displayPosition === 1 ? (
                /* First in queue */
                <div className="text-center py-4">
                  <div className="text-xs text-[#7A7A72] uppercase tracking-widest font-medium mb-2">You are</div>
                  <div className="text-5xl font-extrabold text-[#0F6E56] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Next
                  </div>
                  <p className="text-sm text-[#7A7A72]">You are first in line. Please stay nearby or come in now.</p>
                </div>
              ) : (
                /* Normal waiting state */
                <>
                  <div className="text-center mb-5">
                    <div className="text-xs text-[#7A7A72] uppercase tracking-widest font-medium mb-1">Your position</div>
                    <div className="text-7xl font-extrabold text-[#0E0E0C] leading-none tabular-nums" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>
                      #{displayPosition}
                    </div>
                    <div className="text-sm text-[#7A7A72] mt-1">in the queue</div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-xs text-[#7A7A72] mb-1.5">
                      <span>Progress to your turn</span>
                      <span className="tabular-nums">{displayAhead} {displayAhead === 1 ? "person" : "people"} ahead</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#ECEAE4]">
                      <div
                        className="h-full rounded-full bg-[#0F6E56] transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] p-4 text-center">
                      <div className="text-[10px] text-[#7A7A72] uppercase tracking-widest font-medium mb-1">Ahead of you</div>
                      <div className="text-3xl font-bold text-[#0E0E0C] tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {displayAhead}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] p-4 text-center">
                      <div className="text-[10px] text-[#7A7A72] uppercase tracking-widest font-medium mb-1">Est. wait</div>
                      <div className="text-3xl font-bold text-[#0E0E0C] tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {data.waitMinutes > 0 ? data.waitMinutes : "<1"}
                        <span className="text-sm font-medium text-[#7A7A72] ml-1">min</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isServed && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✓</div>
              <p className="font-semibold text-[#0E0E0C] mb-1">You've been served</p>
              <p className="text-sm text-[#7A7A72]">Thank you for your patience!</p>
            </div>
          )}

          {isNoShow && (
            <div className="text-center py-4">
              <p className="text-sm font-medium text-[#0E0E0C] mb-1">Marked as no-show</p>
              <p className="text-sm text-[#7A7A72]">Ask staff to re-add you if needed.</p>
            </div>
          )}
        </div>

        {/* Self-manage actions */}
        {isWaiting && (
          <div className="mt-4 space-y-3">
            {pushbackDone ? (
              <div className="bg-[#E8F5F1] border border-[#0F6E56]/20 rounded-2xl px-5 py-4 text-center">
                <p className="text-sm font-medium text-[#0F6E56]">Your spot has been moved back.</p>
                <p className="text-xs text-[#7A7A72] mt-1">We'll alert you when you're close.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#DDD9D0] rounded-2xl px-5 py-4 shadow-sm">
                <button
                  onClick={handlePushback}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0F6E56] px-4 text-sm font-semibold text-white hover:bg-[#0C5946] transition-colors disabled:opacity-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  {actionLoading ? "Moving..." : "Move me to the back of the queue"}
                </button>
                {pushbackError && (
                  <p className="mt-3 text-center text-xs font-medium text-red-500">{pushbackError}</p>
                )}
              </div>
            )}

            {!showRemoveConfirm ? (
              <button onClick={() => setShowRemoveConfirm(true)}
                className="w-full text-sm text-[#7A7A72] hover:text-red-500 transition-colors py-2 text-center">
                Remove me from the queue
              </button>
            ) : (
              <div className="bg-white border border-red-200 rounded-2xl px-5 py-4 shadow-sm">
                <p className="text-sm font-medium text-[#0E0E0C] mb-1">Are you sure?</p>
                <p className="text-xs text-[#7A7A72] mb-4">You will lose your spot and need to rejoin by scanning the QR code.</p>
                <div className="flex gap-2">
                  <button onClick={handleRemove} disabled={removing}
                    className="flex-1 h-9 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                    {removing ? "Removing…" : "Yes, remove me"}
                  </button>
                  <button onClick={() => setShowRemoveConfirm(false)}
                    className="flex-1 h-9 border border-[#DDD9D0] rounded-xl text-sm text-[#7A7A72] hover:bg-[#F7F5F0] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={sharePosition}
          className="mt-4 w-full rounded-2xl border border-[#DDD9D0] bg-white px-5 py-4 text-sm font-medium text-[#0E0E0C] shadow-sm hover:bg-[#E8F5F1] hover:text-[#0F6E56] transition-colors">
          {copied ? "Link copied" : "Share your position"}
        </button>

        <p className="mt-6 text-xs text-[#7A7A72] text-center">
          This page updates every few seconds. Pull down to refresh on mobile.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    waiting: { label: "Waiting",  bg: "bg-[#E8F5F1]", text: "text-[#0F6E56]" },
    called:  { label: "Called",   bg: "bg-amber-50",  text: "text-amber-600" },
    served:  { label: "Served",   bg: "bg-green-50",  text: "text-green-700" },
    no_show: { label: "No-show",  bg: "bg-[#F3F4F6]", text: "text-[#7A7A72]"  },
  };
  const v = map[status] ?? map.waiting;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${v.bg} ${v.text}`}>
      {v.label}
        </span>
  );
}

// status done
// Done
