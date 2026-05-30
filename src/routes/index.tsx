import { useEffect, useRef } from "react";
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
  useEffect(() => { document.title = "Possac — Virtual queue for Rwanda's businesses"; }, []);
  if (loading || user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin" />
    </div>
  );
  return <Landing />;
}

/* ─── TICKER ─────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Virtual queue", "SMS notifications", "QR code joining", "Zero apps needed",
  "Real-time updates", "Staff dashboard", "Automatic alerts", "Rwanda-built",
  "Virtual queue", "SMS notifications", "QR code joining", "Zero apps needed",
  "Real-time updates", "Staff dashboard", "Automatic alerts", "Rwanda-built",
];

/* ─── MAIN LANDING ────────────────────────────────────────── */
function Landing() {
  return (
    <div className="grain min-h-screen bg-[#F7F5F0] overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-6xl px-5 pt-4">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-[#DDD9D0] rounded-2xl px-5 h-14 shadow-sm">
            <PossacLogo />
            <div className="hidden sm:flex items-center gap-6 text-sm text-[#7A7A72]">
              <a href="#how" className="hover:text-[#0E0E0C] transition-colors">How it works</a>
              <a href="#sms" className="hover:text-[#0E0E0C] transition-colors">SMS</a>
              <a href="#sectors" className="hover:text-[#0E0E0C] transition-colors">Who it's for</a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-[#7A7A72] hover:text-[#0E0E0C] transition-colors px-3 py-1.5 hidden sm:block">
                Sign in
              </Link>
              <Link to="/signup" className="btn-press text-sm font-medium bg-[#0E0E0C] text-white px-4 py-2 rounded-xl hover:bg-[#1a1a16] transition-colors">
                Start free →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-28 pb-20 px-5">
        {/* Background accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0F6E56]/6 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-6xl w-full">
          {/* Eyebrow */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 bg-white border border-[#DDD9D0] rounded-full px-4 py-1.5 text-xs text-[#7A7A72] mb-8 shadow-sm">
            <span className="relative h-2 w-2 pulse-dot rounded-full bg-[#0F6E56]" />
            Live in Rwanda · Free to start
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up delay-100 font-display text-[clamp(52px,8vw,96px)] font-800 leading-[0.95] tracking-[-0.03em] text-[#0E0E0C] max-w-4xl"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
          >
            Your customers<br />
            <span className="text-[#0F6E56]">deserve better</span><br />
            than waiting.
          </h1>

          <p className="animate-fade-up delay-200 mt-7 text-[18px] text-[#7A7A72] max-w-lg leading-relaxed font-light">
            Possac gives any business a virtual queue in minutes. Customers scan a QR, wait from anywhere, and come back only when it's their turn.
          </p>

          <div className="animate-fade-up delay-300 mt-9 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="btn-press inline-flex items-center gap-2 bg-[#0F6E56] text-white text-[15px] font-medium px-7 py-3.5 rounded-xl hover:bg-[#0a5a44] transition-colors shadow-lg shadow-[#0F6E56]/25">
              Get started — it's free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link to="/login" className="btn-press inline-flex items-center gap-2 text-[15px] text-[#3A3A35] border border-[#DDD9D0] bg-white px-7 py-3.5 rounded-xl hover:border-[#0F6E56]/40 hover:bg-[#F0FDF9] transition-colors">
              Sign in
            </Link>
          </div>

          {/* Stat pills */}
          <div className="animate-fade-up delay-400 mt-12 flex flex-wrap gap-3">
            {[
              { v: "< 2 min", l: "to set up" },
              { v: "3×", l: "automatic SMS alerts" },
              { v: "0", l: "apps for customers" },
              { v: "100%", l: "works on any phone" },
            ].map((s) => (
              <div key={s.l} className="bg-white border border-[#DDD9D0] rounded-xl px-4 py-2.5 flex items-baseline gap-2 shadow-sm">
                <span className="font-display font-700 text-[#0E0E0C] text-lg" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{s.v}</span>
                <span className="text-xs text-[#7A7A72]">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="animate-fade-in delay-500 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-[#7A7A72] tracking-widest uppercase">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-[#7A7A72] to-transparent" />
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="border-y border-[#DDD9D0] bg-[#0E0E0C] py-4 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-8 text-sm font-medium text-white/60 uppercase tracking-widest shrink-0">
              {item}
              <span className="h-1 w-1 rounded-full bg-[#0F6E56]" />
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 sm:py-32 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
            <div>
              <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">Process</p>
              <h2
                className="font-display text-[clamp(36px,5vw,60px)] font-700 leading-[1.0] tracking-tight text-[#0E0E0C]"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
              >
                Up and running<br />in four steps.
              </h2>
            </div>
            <Link to="/signup" className="text-sm text-[#0F6E56] hover:underline">
              Create your account →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Create account", d: "Sign up in 2 minutes. Pick your business type and customize your SMS messages. Queue is live immediately.", icon: "M12 4v16m8-8H4" },
              { n: "02", t: "Place QR code", d: "Download and print your unique QR code. Stick it at your entrance. That's the only hardware you need.", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 17h.01M14 14h.01M20 14h.01M14 20h.01M20 20h.01M17 14v.01M14 17v.01M20 17v.01M17 20v.01" },
              { n: "03", t: "Customers join", d: "They scan the QR from their phone, enter their name, and join instantly. No app, no account needed.", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
              { n: "04", t: "Call when ready", d: "One tap on your dashboard sends an SMS. They come back exactly when it's their turn. No crowding.", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
            ].map((s, i) => (
              <div key={s.n} className="card-hover group bg-white border border-[#DDD9D0] rounded-2xl p-6 cursor-default">
                <div className="flex items-start justify-between mb-5">
                  <span
                    className="font-display text-4xl font-800 text-[#ECEAE4]"
                    style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
                  >{s.n}</span>
                  <div className="h-9 w-9 rounded-xl bg-[#F7F5F0] flex items-center justify-center group-hover:bg-[#E8F5F1] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon} />
                    </svg>
                  </div>
                </div>
                <h3 className="font-medium text-[#0E0E0C] mb-2">{s.t}</h3>
                <p className="text-sm text-[#7A7A72] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO WAYS ── */}
      <section className="py-24 sm:py-32 px-5 bg-[#0E0E0C]">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium text-[#2DD4A0] uppercase tracking-[0.2em] mb-3">Flexibility</p>
          <h2
            className="font-display text-[clamp(36px,5vw,60px)] font-700 leading-[1.0] tracking-tight text-white mb-16"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          >
            Two ways in.<br />One live queue.
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-8 hover:bg-white/8 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-[#0F6E56]/20 flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DD4A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h.01M14 17h.01M14 20h.01M17 14h.01M17 17h3v3h-3zM20 14h.01"/>
                </svg>
              </div>
              <h3
                className="font-display text-xl font-600 text-white mb-3"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600 }}
              >Customer scans QR</h3>
              <p className="text-[#8A8A82] leading-relaxed text-sm">
                They scan the QR code at your door, type their name, and join. No app, no account, no phone number required. Works on every smartphone.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-[#2DD4A0] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4A0]" />
                Works on any smartphone
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/5 p-8 hover:bg-white/8 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-[#0F6E56]/20 flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DD4A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3
                className="font-display text-xl font-600 text-white mb-3"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600 }}
              >Staff adds them</h3>
              <p className="text-[#8A8A82] leading-relaxed text-sm">
                Receptionist enters name and phone in 5 seconds. Works for walk-ins, phone bookings, and customers without smartphones. Same queue, same dashboard.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-[#2DD4A0] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4A0]" />
                Works for every customer
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SMS ── */}
      <section id="sms" className="py-24 sm:py-32 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">SMS Notifications</p>
              <h2
                className="font-display text-[clamp(36px,4vw,52px)] font-700 leading-[1.05] tracking-tight text-[#0E0E0C] mb-6"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
              >
                Customers always know<br />where they stand.
              </h2>
              <p className="text-[#7A7A72] leading-relaxed mb-8">
                Three automatic messages. Fully customizable. Works on every phone in Rwanda — no internet required.
              </p>
              <div className="space-y-4">
                {[
                  { step: "1", label: "On join", desc: "Instant confirmation with position and estimated wait time." },
                  { step: "2", label: "Heads-up", desc: "Automatic alert when they're a few spots away — time to head back." },
                  { step: "3", label: "Your turn", desc: "One tap from you sends the final call. They walk in, you serve them." },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="h-7 w-7 rounded-full bg-[#0F6E56]/10 flex items-center justify-center text-xs font-medium text-[#0F6E56] shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <span className="text-sm font-medium text-[#0E0E0C]">{s.label} — </span>
                      <span className="text-sm text-[#7A7A72]">{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SMS mockup */}
            <div className="relative">
              <div className="bg-[#0E0E0C] rounded-3xl p-6 space-y-3">
                <div className="text-xs text-[#4A4A42] uppercase tracking-widest mb-5 font-medium">Incoming messages</div>
                {[
                  { time: "Now", body: "Hi Amina, you are #4 at Cuts & Style. Estimated wait: 35 min. We'll alert you when you're close.", tag: "Joined" },
                  { time: "25 min later", body: "Hi Amina, you're 3rd in line at Cuts & Style. Please start making your way back.", tag: "Heads-up" },
                  { time: "10 min later", body: "Hi Amina, it's your turn at Cuts & Style. Please come in now.", tag: "Your turn" },
                ].map((m, i) => (
                  <div key={i} className="group">
                    <div className="text-[10px] text-[#4A4A42] mb-1.5 uppercase tracking-wider">{m.time}</div>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 bg-[#0F6E56] rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-sm text-white leading-relaxed">{m.body}</p>
                      </div>
                      <span className="text-[10px] text-[#2DD4A0] bg-[#2DD4A0]/10 border border-[#2DD4A0]/20 px-2 py-1 rounded-full shrink-0 mt-1 whitespace-nowrap">{m.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* glow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#0F6E56]/20 blur-2xl rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTORS ── */}
      <section id="sectors" className="py-24 sm:py-32 px-5 bg-[#ECEAE4]">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">Industries</p>
          <h2
            className="font-display text-[clamp(36px,5vw,60px)] font-700 leading-[1.0] tracking-tight text-[#0E0E0C] mb-14"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          >
            Built for any business<br />with a queue.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { n: "Salons & Barbershops", d: "Keep clients informed while they wait elsewhere." },
              { n: "Pharmacies", d: "Let patients wait comfortably while prescriptions are prepared." },
              { n: "Banks & SACCOs", d: "Reduce crowding in branches during peak hours." },
              { n: "Government offices", d: "Help citizens plan their visit without wasting a full day." },
              { n: "Insurance companies", d: "Manage client flow without a physical waiting room." },
              { n: "Restaurants & cafés", d: "Seat guests when their table is actually ready." },
            ].map((s) => (
              <div key={s.n} className="card-hover bg-white border border-[#DDD9D0] rounded-2xl p-5 cursor-default">
                <div className="h-8 w-8 rounded-lg bg-[#0F6E56]/10 flex items-center justify-center mb-4">
                  <div className="h-2 w-2 rounded-full bg-[#0F6E56]" />
                </div>
                <h3 className="text-sm font-medium text-[#0E0E0C] mb-1">{s.n}</h3>
                <p className="text-xs text-[#7A7A72] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="py-24 sm:py-32 px-5">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">Contact</p>
          <h2
            className="font-display text-[clamp(32px,4vw,48px)] font-700 leading-tight tracking-tight text-[#0E0E0C] mb-4"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          >
            We'd love to<br />hear from you.
          </h2>
          <p className="text-[#7A7A72] mb-10 text-sm">Question about pricing, setup, or a custom plan? Send us a message.</p>

          <form action="https://formspree.io/f/xbdbongl" method="POST" className="space-y-4">
            <input type="hidden" name="_subject" value="New Possac enquiry" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Full name</label>
                <input type="text" name="name" required placeholder="Your name"
                  className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 h-11 text-sm outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Email</label>
                <input type="email" name="email" required placeholder="your@email.com"
                  className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 h-11 text-sm outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Subject</label>
              <input type="text" name="subject" required placeholder="What is this about?"
                className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 h-11 text-sm outline-none focus:border-[#0F6E56] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Message</label>
              <textarea name="message" required rows={4} placeholder="Tell us more..."
                className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F6E56] transition-colors resize-none" />
            </div>
            <button type="submit"
              className="btn-press w-full bg-[#0F6E56] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#0a5a44] transition-colors shadow-lg shadow-[#0F6E56]/20">
              Send message
            </button>
          </form>
          <p className="text-center text-xs text-[#7A7A72] mt-6">
            Or email us at{" "}
            <a href="mailto:hello.possac@gmail.com" className="text-[#0F6E56] hover:underline">hello.possac@gmail.com</a>
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden bg-[#0E0E0C] rounded-3xl px-8 py-16 sm:px-14 sm:py-20 text-center">
            {/* bg glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0F6E56]/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative">
              <p className="text-xs font-medium text-[#2DD4A0] uppercase tracking-[0.2em] mb-4">Get started today</p>
              <h2
                className="font-display text-[clamp(32px,5vw,56px)] font-700 leading-[1.05] tracking-tight text-white mb-5"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
              >
                Ready to run<br />a better queue?
              </h2>
              <p className="text-[#8A8A82] text-base max-w-sm mx-auto mb-8">
                Free to start. Set up in under 2 minutes. No technical knowledge needed.
              </p>
              <Link to="/signup"
                className="btn-press inline-flex items-center gap-2 bg-white text-[#0E0E0C] px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-[#F0EDE6] transition-colors">
                Create your account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-[#DDD9D0]">
            <PossacLogo />
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#7A7A72]">
              <Link to="/login" className="hover:text-[#0E0E0C] transition-colors">Sign in</Link>
              <Link to="/signup" className="hover:text-[#0E0E0C] transition-colors">Sign up</Link>
              <Link to="/privacy" className="hover:text-[#0E0E0C] transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-[#0E0E0C] transition-colors">Terms</Link>
              <a href="mailto:hello.possac@gmail.com" className="hover:text-[#0E0E0C] transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7A7A72]">© 2026 Possac.</span>
              <a href="https://launchllama.co?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener noreferrer">
                <img src="https://speaktechenglish.com/wp-content/uploads/2026/04/Screenshot_2026-04-09_at_17.40.44-removebg-preview.png"
                  alt="Featured on Launch Llama" width="90" height="22" style={{ opacity: 0.5 }} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
