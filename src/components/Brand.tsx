export function PossacLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8 rounded-md bg-primary flex items-center justify-center">
        <div className="absolute inset-1.5 rounded-sm border-2 border-primary-foreground/80" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary-foreground" />
      </div>
      <span className="font-semibold text-lg tracking-tight text-foreground">Possac</span>
    </div>
  );
}
