export function PossacLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
        <div className="absolute inset-1.5 rounded-sm border-[1.5px] border-primary-foreground/80" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-primary-foreground" />
      </div>
      <span className="font-semibold text-[15px] tracking-tight text-foreground">Possac</span>
    </div>
  );
}
