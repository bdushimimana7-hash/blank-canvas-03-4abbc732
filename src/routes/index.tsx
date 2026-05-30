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
    document.title = "Possac — Stop losing customers to long lines";
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

      {/* NAV */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/" aria-label="Possac home">
            <PossacLogo />
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-secondary">
              Sign in
            </Link>
            <Button asChild size="sm" className="ml-2">
              <Link to="/signup">Start for free</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Free to start — no credit card needed
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-foreground max-w-3xl">
          Stop losing customers to long lines.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
          Possac gives your business a virtual queue. Customers join by scanning a QR code or staff adds them in seconds. They wait from anywhere and come back only when it&apos;s their turn.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/signup">Start for free</Link>
          </Button>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Already have an account →
          </Link>
        </div>

        {/* MINI STATS */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg">
          {[
            { value: "2 min", label: "Setup time" },
            { value: "3", label: "SMS alerts per customer" },
            { value: "0", label: "Apps to download" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-secondary/40 px-4 py-4 text-center">
              <div className="text-2xl font-semibold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">How it works</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg">
            From sign up to your first customer in under 2 minutes.
          </h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Create your account", d: "Sign up, pick your sector, customize your SMS messages. Your queue is live immediately." },
              { n: "02", t: "Place your QR code", d: "Download and print the QR code. Stick it at your entrance. Customers scan to join instantly." },
              { n: "03", t: "Customers wait anywhere", d: "They see their position and estimated wait on their phone. They leave and come back when ready." },
              { n: "04", t: "Call them when ready", d: "One tap sends an SMS. No shouting names. No crowded waiting room." },
            ].map((s) => (
              <li key={s.n} className="relative pl-0">
                <div className="text-3xl font-semibold text-border mb-4">{s.n}</div>
                <h3 className="text-sm font-semibold text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TWO WAYS TO JOIN */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">Flexible by design</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg">
            Two ways to join. One queue.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="text-primary"/>
                  <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="text-primary"/>
                  <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="text-primary"/>
                  <rect x="13" y="13" width="3" height="3" rx="0.5" fill="currentColor" className="text-primary"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Scan the QR code</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Customer scans the QR at the entrance, enters their name, and joins instantly. No app. No account. No phone number required — perfect for customers who value their privacy.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Staff adds them</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Receptionist enters name and phone number in 5 seconds. Works for walk-ins, phone bookings, or customers without smartphones. Both methods feed the same live queue.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SMS PREVIEW */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">SMS notifications</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg">
            Your customers always know where they stand.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">Three automatic messages. Works on every phone — no internet needed.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { label: "On join", tag: "Instant", body: "Hi Amina, you are number 4 in the queue at Cuts & Style. Estimated wait: 35 minutes. We will alert you when you are close." },
              { label: "Heads-up", tag: "Automatic", body: "Hi Amina, you are 3rd in line at Cuts & Style. Please start making your way now." },
              { label: "Your turn", tag: "One tap", body: "Hi Amina, it is your turn at Cuts & Style. Please come in now." },
            ].map((m) => (
              <div key={m.label} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wider">{m.label}</span>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{m.tag}</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-primary px-5 py-4 text-primary-foreground">
                  <p className="text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">Who it&apos;s for</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg">
            Built for any business with a queue.
          </h2>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: "Salons & barbershops", d: "Keep clients informed while they wait elsewhere." },
              { name: "Pharmacies", d: "Let patients wait comfortably while prescriptions are prepared." },
              { name: "Banks & SACCOs", d: "Reduce crowding in branches during busy hours." },
              { name: "Government offices", d: "Help citizens plan their visit without wasting a full day." },
              { name: "Insurance companies", d: "Manage client flow without a physical waiting room." },
              { name: "Restaurants & cafés", d: "Seat guests when their table is ready, not before." },
            ].map((s) => (
              <div key={s.name} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-lg px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">Get in touch</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
            We&apos;d love to hear from you.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Have a question or want to set up Possac for your business? Send us a message.
          </p>
          <form action="https://formspree.io/f/xbdbongl" method="POST" className="mt-8 flex flex-col gap-4">
            <input type="hidden" name="_subject" value="New Possac enquiry" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">Full name</label>
                <input type="text" name="name" required placeholder="Your name"
                  className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:border-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">Email address</label>
                <input type="email" name="email" required placeholder="your@email.com"
                  className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Subject</label>
              <input type="text" name="subject" required placeholder="What is this about?"
                className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:border-primary transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Message</label>
              <textarea name="message" required rows={4} placeholder="Tell us more..."
                className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:border-primary transition-colors resize-none" />
            </div>
            <button type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity">
              Send message
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-5">
            Or email us at{" "}
            <a href="mailto:hello.possac@gmail.com" className="underline hover:text-foreground transition-colors">
              hello.possac@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <div className="rounded-2xl bg-primary px-8 py-12 sm:px-14 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-primary-foreground">
              Ready to run a better queue?
            </h2>
            <p className="mt-4 text-primary-foreground/70 text-base max-w-md mx-auto">
              Free to start. Set up in minutes. No technical knowledge needed.
            </p>
            <div className="mt-8">
              <Link to="/signup"
                className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3 rounded-full font-medium text-sm hover:bg-secondary transition-colors">
                Create your account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <PossacLogo />
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of use</Link>
              <a href="mailto:hello.possac@gmail.com" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">© 2026 Possac.</span>
              <a href="https://launchllama.co?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener noreferrer">
                <img
                  src="https://speaktechenglish.com/wp-content/uploads/2026/04/Screenshot_2026-04-09_at_17.40.44-removebg-preview.png"
                  alt="Featured on Launch Llama"
                  width="110" height="28"
                  style={{ opacity: 0.75 }}
                />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
