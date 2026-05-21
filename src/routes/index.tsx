import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";

export default function IndexPage() {
  const { user, loading, role } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    if (role === "superadmin") navigate("/superadmin");
    else if (role === "owner") navigate("/dashboard");
    else if (role === "staff") navigate("/queue");
  }, [user, loading, role, navigate]);

  useEffect(() => {
    document.title = "Possac — A simple queue system for busy businesses";
  }, []);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <Landing />;
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="Possac home">
            <PossacLogo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/signup">Start for free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] text-foreground">
          Stop losing customers to long lines.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A simple queue system for busy businesses. Your staff adds customers, they wait
          from wherever they want, and come back only when it&apos;s their turn.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link to="/signup">Start for free</Link>
          </Button>
          <Link
            to="/login"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Sign in →
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Free to start. No credit card needed.
        </p>
      </section>

      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider">
              How it works
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              From sign up to first customer in minutes.
            </h2>
          </div>
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Create your account", d: "Sign up and set up your business in under 2 minutes." },
              { t: "Add customers to the queue", d: "Your receptionist adds a name and phone number. That's it." },
              { t: "They wait from anywhere", d: "The customer gets an SMS with their position and estimated wait. They can leave and come back." },
              { t: "Call them when ready", d: "One tap sends \"It's your turn.\" No crowded waiting rooms." },
            ].map((s, i) => (
              <li key={i} className="relative">
                <div className="text-sm font-mono text-primary">0{i + 1}</div>
                <h3 className="mt-3 text-base font-semibold text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider">
              SMS, every step
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Your customers always know where they stand.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { label: "On join", body: "Hi Amina, you are number 4 in the queue. Estimated wait: 35 minutes. We will alert you when you are close." },
              { label: "Heads-up", body: "Hi Amina, you are 3rd in line. Start making your way now." },
              { label: "Your turn", body: "Hi Amina, it is your turn. Please come in now." },
            ].map((m) => (
              <div key={m.label} className="flex flex-col gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {m.label}
                </span>
                <div className="relative max-w-sm rounded-2xl rounded-bl-md bg-primary px-5 py-4 text-primary-foreground shadow-sm">
                  <p className="text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider">
              Who it&apos;s for
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Built for any business with a queue.
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
            {["Salons", "Pharmacies", "Banks & SACCOs", "Government offices", "Insurance companies", "Restaurants"].map((s) => (
              <div key={s} className="bg-card px-6 py-8 text-center text-sm font-medium text-foreground">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:py-32 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Ready to run a better queue?
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Free to start. Set up in minutes. No technical knowledge needed.
          </p>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link to="/signup">Create your account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PossacLogo />
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© 2026 Possac.</p>
        </div>
      </footer>
    </div>
  );
}