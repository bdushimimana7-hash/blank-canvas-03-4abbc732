import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { PossacLogo } from "@/components/Brand";

export default function IndexPage() {
  const { user, loading, role } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    if (role === "superadmin") navigate("/superadmin");
    else if (role === "owner") navigate("/dashboard");
    else if (role === "staff") navigate("/queue");
  }, [user, loading, role, navigate]);
  useEffect(() => { document.title = "Possac — Stop losing customers to long lines"; }, []);
  if (loading || user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  return <Landing />;
}

function Landing() {
  return (
    <div className="min-h-screen bg-white text-[#111827]">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
          <PossacLogo />
          <div className="flex items-center gap-1">
            <Link to="/login" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-md hover:bg-[#F9FAFB]">
              Sign in
            </Link>
            <Link to="/signup" className="text-sm font-medium bg-[#0F6E56] text-white px-4 py-1.5 rounded-full hover:bg-[#0D5E49] transition-colors ml-1">
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="inline-flex items-center gap-2 text-xs text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-3 py-1 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E56]" />
          Free to start
        </div>
        <h1 className="text-[44px] sm:text-[64px] font-semibold tracking-[-0.03em] leading-[1.02] text-[#111827] max-w-2xl">
          Stop losing customers to long lines.
        </h1>
        <p className="mt-5 text-[18px] text-[#6B7280] max-w-lg leading-relaxed font-normal">
          Possac gives your business a virtual queue. Customers scan a QR code or staff adds them in seconds. They wait from anywhere and come back only when it&apos;s their turn.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 bg-[#0F6E56] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#0D5E49] transition-colors shadow-sm">
            Start for free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link to="/login" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors px-4 py-3">
            Sign in →
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          {[
            { v: "2 min", l: "Setup time" },
            { v: "3", l: "Automatic SMS alerts" },
            { v: "0", l: "Apps to download" },
          ].map((s) => (
            <div key={s.l} className="border border-[#E5E7EB] rounded-xl px-5 py-3 bg-[#F9FAFB]">
              <div className="text-xl font-semibold text-[#111827]">{s.v}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] max-w-md">
            From sign up to your first customer in minutes.
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Create your account", d: "Sign up, pick your sector, customize your SMS messages. Your queue is live immediately." },
              { n: "02", t: "Place your QR code", d: "Download and print the QR code. Stick it at your entrance. Customers scan to join instantly." },
              { n: "03", t: "Customers wait anywhere", d: "They see their position and estimated wait on their phone. They leave and come back when ready." },
              { n: "04", t: "Call them when ready", d: "One tap sends an SMS. No shouting names. No crowded waiting room." },
            ].map((s) => (
              <li key={s.n}>
                <div className="text-3xl font-semibold text-[#E5E7EB] mb-3 leading-none">{s.n}</div>
                <h3 className="text-[14px] font-semibold text-[#111827]">{s.t}</h3>
                <p className="mt-1.5 text-sm text-[#6B7280] leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TWO WAYS */}
      <section className="border-t border-[#E5E7EB]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-widest mb-3">Flexible by design</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] max-w-md">
            Two ways to join. One queue.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                t: "Scan the QR code",
                d: "Customer scans the QR at the entrance, enters their name, and joins instantly. No app. No account. No phone number required — perfect for customers who value their privacy.",
                note: "Works on any smartphone"
              },
              {
                t: "Staff adds them",
                d: "Receptionist enters name and phone in 5 seconds. Works for walk-ins, phone bookings, or customers without smartphones. Both methods feed the same live queue.",
                note: "Works for every customer"
              },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-[#E5E7EB] bg-white p-7 hover:border-[#0F6E56]/30 transition-colors">
                <h3 className="text-[15px] font-semibold text-[#111827]">{c.t}</h3>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{c.d}</p>
                <p className="mt-4 text-xs text-[#0F6E56] font-medium">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMS */}
      <section className="border-t border-[#E5E7EB] bg-[#111827]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-[#34D399] uppercase tracking-widest mb-3">SMS notifications</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white max-w-md">
            Your customers always know where they stand.
          </h2>
          <p className="mt-3 text-sm text-white/50 max-w-sm">Three automatic messages. Works on every phone in Rwanda — no internet needed.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { label: "On join", tag: "Instant", body: "Hi Amina, you are number 4 in the queue at Cuts & Style. Estimated wait: 35 minutes. We will alert you when you are close." },
              { label: "Heads-up", tag: "Automatic", body: "Hi Amina, you are 3rd in line at Cuts & Style. Please start making your way now." },
              { label: "Your turn", tag: "One tap", body: "Hi Amina, it is your turn at Cuts & Style. Please come in now." },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{m.label}</span>
                  <span className="text-xs text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20 px-2 py-0.5 rounded-full">{m.tag}</span>
                </div>
                <div className="bg-[#0F6E56] rounded-2xl rounded-tl-sm px-5 py-4">
                  <p className="text-sm text-white leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO */}
      <section className="border-t border-[#E5E7EB]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-widest mb-3">Who it&apos;s for</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] max-w-md">
            Built for any business with a queue.
          </h2>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { n: "Salons & barbershops", d: "Keep clients informed while they wait elsewhere." },
              { n: "Pharmacies", d: "Let patients wait while prescriptions are prepared." },
              { n: "Banks & SACCOs", d: "Reduce crowding in branches during busy hours." },
              { n: "Government offices", d: "Help citizens plan their visit without wasting a day." },
              { n: "Insurance companies", d: "Manage client flow without a physical waiting room." },
              { n: "Restaurants & cafés", d: "Seat guests when their table is ready, not before." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#0F6E56]/30 hover:bg-[#F9FAFB] transition-colors">
                <h3 className="text-[13px] font-semibold text-[#111827]">{s.n}</h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="mx-auto max-w-lg px-5 py-16 sm:py-20">
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-widest mb-3">Get in touch</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827]">
            We&apos;d love to hear from you.
          </h2>
          <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">Have a question or want to set up Possac for your business?</p>
          <form action="https://formspree.io/f/xbdbongl" method="POST" className="mt-8 flex flex-col gap-4">
            <input type="hidden" name="_subject" value="New Possac enquiry" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#374151]">Full name</label>
                <input type="text" name="name" required placeholder="Your name"
                  className="border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#374151]">Email</label>
                <input type="email" name="email" required placeholder="your@email.com"
                  className="border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#374151]">Subject</label>
              <input type="text" name="subject" required placeholder="What is this about?"
                className="border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#374151]">Message</label>
              <textarea name="message" required rows={4} placeholder="Tell us more..."
                className="border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-[#0F6E56] transition-colors resize-none" />
            </div>
            <button type="submit" className="w-full bg-[#0F6E56] text-white py-2.5 rounded-full font-medium text-sm hover:bg-[#0D5E49] transition-colors">
              Send message
            </button>
          </form>
          <p className="text-center text-xs text-[#9CA3AF] mt-5">
            Or email <a href="mailto:hello.possac@gmail.com" className="underline hover:text-[#111827] transition-colors">hello.possac@gmail.com</a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E5E7EB]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <div className="bg-[#0F6E56] rounded-2xl px-8 py-14 sm:px-14 text-center">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              Ready to run a better queue?
            </h2>
            <p className="mt-4 text-white/60 text-base max-w-md mx-auto">
              Free to start. Set up in minutes. No technical knowledge needed.
            </p>
            <Link to="/signup" className="inline-flex items-center gap-2 mt-8 bg-white text-[#111827] px-7 py-3 rounded-full font-medium text-sm hover:bg-[#F9FAFB] transition-colors">
              Create your account →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E7EB]">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <PossacLogo />
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {[
                { to: "/login", label: "Sign in" },
                { to: "/signup", label: "Sign up" },
                { to: "/privacy", label: "Privacy" },
                { to: "/terms", label: "Terms" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors">{l.label}</Link>
              ))}
              <a href="mailto:hello.possac@gmail.com" className="text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#9CA3AF]">© 2026 Possac.</span>
              <a href="https://launchllama.co?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener noreferrer">
                <img src="https://speaktechenglish.com/wp-content/uploads/2026/04/Screenshot_2026-04-09_at_17.40.44-removebg-preview.png"
                  alt="Featured on Launch Llama" width="100" height="25" style={{ opacity: 0.6 }} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
