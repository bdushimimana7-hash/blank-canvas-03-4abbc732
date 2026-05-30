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

  // Self-manage state
  const [showPushback, setShowPushback] = useState(false);
  const [pushbackMins, setPushbackMins] = useState<15 | 30 | 45 | null>(null);
  const [pushbackDone, setPushbackDone] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    if (payload?.businessName) document.title = `${payload.businessName} — your place in line`;
  }, [entryId, removed]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(refresh, 3000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const handlePushback = async (mins: 15 | 30 | 45) => {
    setActionLoading(true);
    const { data: res, error } = await supabase.functions.invoke("public-queue", {
      body: { action: "pushback", data: { entryId, delayMinutes: mins } },
    });
    setActionLoading(false);
    if (error || (res as any)?.error) return;
    setPushbackDone(true);
    setShowPushback(false);
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
          <div className="h-12 w-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-[#0E0E0C] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
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

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {isCalled && (
        <div className="w-full bg-[#0F6E56] text-white px-5 py-4 text-center text-sm font-semibold">
          🎉 It's your turn — please come in now
        </div>
      )}

      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex justify-center mb-6"><PossacLogo /></div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-center text-[#0E0E0C]"
          style={{ fontFamily: "'Syne', sans-serif" }}>{data.businessName}</h1>
        <p className="text-sm text-[#7A7A72] text-center mt-1">Hi {data.name} 👋</p>

        {/* Main status card */}
        <div className="mt-6 bg-white border border-[#DDD9D0] rounded-2xl p-6 text-center shadow-sm">
          <StatusBadge status={data.status} />

          {!isServed && !isNoShow && (
            <>
              <div className="mt-5 text-xs text-[#7A7A72] uppercase tracking-widest font-medium">You are</div>
              <div className="mt-1 font-display text-6xl font-800 text-[#0E0E0C] tabular-nums leading-none"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>
                #{data.position}
              </div>
              <div className="mt-1 text-sm text-[#7A7A72]">in the queue</div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] p-3">
                  <div className="text-[10px] text-[#7A7A72] uppercase tracking-widest font-medium">Ahead of you</div>
                  <div className="mt-1 font-display text-2xl font-700 text-[#0E0E0C] tabular-nums"
                    style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{data.ahead}</div>
                </div>
                <div className="rounded-xl border border-[#DDD9D0] bg-[#F7F5F0] p-3">
                  <div className="text-[10px] text-[#7A7A72] uppercase tracking-widest font-medium">Est. wait</div>
                  <div className="mt-1 font-display text-2xl font-700 text-[#0E0E0C] tabular-nums"
                    style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                    {data.waitMinutes}<span className="text-sm font-medium text-[#7A7A72] ml-1">min</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isServed && (
            <div className="mt-5">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-[#7A7A72]">You've been served. Thank you for your patience!</p>
            </div>
          )}
          {isNoShow && (
            <div className="mt-5">
              <p className="text-sm text-[#7A7A72]">You were marked as no-show. Ask staff to re-add you if needed.</p>
            </div>
          )}
        </div>

        {/* ── SELF-MANAGE ACTIONS (waiting only) ── */}
        {isWaiting && (
          <div className="mt-4 space-y-3">

            {/* Push back spot */}
            {pushbackDone ? (
              <div className="bg-[#E8F5F1] border border-[#0F6E56]/20 rounded-2xl px-5 py-4 text-center">
                <p className="text-sm font-medium text-[#0F6E56]">✓ Got it — your spot has been moved back.</p>
                <p className="text-xs text-[#7A7A72] mt-1">We'll alert you when you're close.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#DDD9D0] rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowPushback(!showPushback)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-[#0E0E0C] hover:bg-[#F7F5F0] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Running late? Push my spot back
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showPushback ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {showPushback && (
                  <div className="border-t border-[#DDD9D0] px-5 py-4">
                    <p className="text-xs text-[#7A7A72] mb-3">How much time do you need?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([15, 30, 45] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => handlePushback(m)}
                          disabled={actionLoading}
                          className="h-10 rounded-xl border border-[#DDD9D0] text-sm font-medium text-[#0E0E0C] hover:border-[#0F6E56] hover:bg-[#E8F5F1] hover:text-[#0F6E56] transition-colors disabled:opacity-50"
                        >
                          {m} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Remove from queue */}
            {!showRemoveConfirm ? (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full text-sm text-[#7A7A72] hover:text-red-500 transition-colors py-2 text-center"
              >
                Remove me from the queue
              </button>
            ) : (
              <div className="bg-white border border-red-200 rounded-2xl px-5 py-4 shadow-sm">
                <p className="text-sm font-medium text-[#0E0E0C] mb-1">Are you sure?</p>
                <p className="text-xs text-[#7A7A72] mb-4">You will lose your spot and need to rejoin by scanning the QR code.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="flex-1 h-9 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {removing ? "Removing…" : "Yes, remove me"}
                  </button>
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    className="flex-1 h-9 border border-[#DDD9D0] rounded-xl text-sm text-[#7A7A72] hover:bg-[#F7F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-[#7A7A72] text-center">This page updates automatically every few seconds.</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    waiting: { label: "Waiting",  bg: "bg-[#E8F5F1]", text: "text-[#0F6E56]" },
    called:  { label: "Called",   bg: "bg-blue-50",   text: "text-blue-600" },
    served:  { label: "Served",   bg: "bg-green-50",  text: "text-green-700" },
    no_show: { label: "No-show",  bg: "bg-[#F3F4F6]", text: "text-[#7A7A72]" },
  };
  const v = map[status] ?? map.waiting;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      {v.label}
    </span>
  );
}
