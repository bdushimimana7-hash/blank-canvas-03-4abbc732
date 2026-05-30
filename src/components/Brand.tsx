export function PossacLogo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="relative h-8 w-8 rounded-xl bg-[#0F6E56] flex items-center justify-center shadow-sm shrink-0">
        {/* Queue lines icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3.5" width="12" height="1.5" rx="0.75" fill="white" opacity="1"/>
          <rect x="2" y="7.25" width="9" height="1.5" rx="0.75" fill="white" opacity="0.75"/>
          <rect x="2" y="11" width="6" height="1.5" rx="0.75" fill="white" opacity="0.5"/>
        </svg>
      </div>
      <span
        className={`font-display font-700 text-[17px] tracking-tight leading-none ${light ? "text-white" : "text-[#0E0E0C]"}`}
        style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
      >
        Possac
      </span>
    </div>
  );
}
