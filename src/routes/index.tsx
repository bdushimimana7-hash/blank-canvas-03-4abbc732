import { useEffect, useRef, useState } from "react";
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

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-5 right-5 z-50 h-10 w-10 rounded-full border border-[#DDD9D0] bg-white text-[#0F6E56] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F6E56]/40 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >↑</button>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

const TICKER_ITEMS = [
  "Virtual queue", "SMS notifications", "QR code joining", "Zero apps needed",
  "Real-time updates", "Staff dashboard", "Automatic alerts", "Rwanda-built",
  "Virtual queue", "SMS notifications", "QR code joining", "Zero apps needed",
  "Real-time updates", "Staff dashboard", "Automatic alerts", "Rwanda-built",
];

const SECTOR_ICONS: Record<string, string> = {
  "Salons & Barbershops": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  "Pharmacies": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "Banks & SACCOs": "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  "Government offices": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  "Insurance companies": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "Restaurants & cafés": "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  "Health facilities": "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 4v10m-5-5h10",
};


function HeroPhoneMockup() {
  return (
    <div className="animate-fade-in delay-300 hidden lg:flex justify-center">
      <div className="relative h-[520px] w-[260px] rounded-[42px] border border-[#0E0E0C]/15 bg-[#0E0E0C] p-3 shadow-2xl shadow-[#0F6E56]/20">
        <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full rounded-[32px] bg-[#F7F5F0] p-5 pt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#7A7A72]">Possac Queue</div>
              <div className="font-display text-lg font-bold text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>Kigali Cuts</div>
            </div>
            <span className="relative h-3 w-3 rounded-full bg-[#0F6E56] animate-pulse" />
          </div>
          <div className="rounded-3xl border border-[#DDD9D0] bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-[#7A7A72]">Your position</div>
            <div className="mt-2 text-6xl font-extrabold leading-none text-[#0F6E56]" style={{ fontFamily: "'Syne', sans-serif" }}>#4</div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#E8F5F1] p-3">
                <div className="text-[10px] text-[#7A7A72]">Ahead</div>
                <div className="font-semibold text-[#0E0E0C]">3</div>
              </div>
              <div className="rounded-xl bg-[#ECEAE4] p-3">
                <div className="text-[10px] text-[#7A7A72]">Wait</div>
                <div className="font-semibold text-[#0E0E0C]">25m</div>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-[#0F6E56] p-4 text-white">
            <div className="text-xs text-white/70">SMS sent</div>
            <p className="mt-1 text-sm leading-relaxed">You are 3rd in line. Please start making your way back.</p>
          </div>
          <div className="mt-4 rounded-2xl border border-[#DDD9D0] bg-white p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#0F6E56]/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            </div>
            <div>
              <div className="text-[10px] text-[#7A7A72]">Your turn!</div>
              <div className="text-xs font-medium text-[#0E0E0C]">Come in now →</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Aline Mukamana", business: "Salon owner, Remera", initials: "AM", quote: "Our waiting area feels calm now. Clients scan, leave for errands, and come back when the SMS arrives. No more crowding at the door." },
    { name: "Jean Bosco Ndayisaba", business: "Pharmacy manager, Nyamirambo", initials: "JB", quote: "Possac helped us reduce crowding during busy evenings without buying any hardware or training customers on an app." },
    { name: "Claudine Uwera", business: "SACCO branch lead, Musanze", initials: "CU", quote: "The staff dashboard is simple enough for the whole team. Customers trust the queue because they can check their place anytime." },
  ];
  return (
    <section className="py-20 sm:py-24 px-5 bg-[#0E0E0C]">
      <div className="mx-auto max-w-6xl">
        <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
          <p className="text-xs font-medium text-[#2DD4A0] uppercase tracking-[0.2em] mb-3">Social proof</p>
          <h2 className="font-display text-[clamp(34px,5vw,56px)] font-bold leading-tight text-white mb-12" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
            Trusted by Rwanda's<br />everyday queues.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <article key={t.name}
              className="reveal rounded-2xl border border-white/10 bg-white/[0.06] p-7 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms` }}>
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width="13" height="13" viewBox="0 0 24 24" fill="#0F6E56"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <svg width="24" height="18" viewBox="0 0 28 20" fill="none" className="mb-3 opacity-20">
                <path d="M0 20V12.667C0 5.481 3.556 1.185 10.667 0l1.333 2c-2.963.593-4.963 1.63-6 3.11C4.963 6.593 4.444 8.37 4.444 10.444H8V20H0zm16 0V12.667C16 5.481 19.556 1.185 26.667 0L28 2c-2.963.593-4.963 1.63-6 3.11-1.037 1.483-1.556 3.26-1.556 5.334H24V20h-8z" fill="white" />
              </svg>
              <p className="text-sm leading-7 text-white/75 mb-6">{t.quote}</p>
              <div className="flex items-center gap-3 border-t border-white/10 pt-5">
                <div className="h-9 w-9 rounded-full bg-[#0F6E56] flex items-center justify-center text-xs font-bold text-white shrink-0">{t.initials}</div>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-[#2DD4A0]">{t.business}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 pt-14">
          {[
            { v: "500+", l: "businesses onboarded" },
            { v: "12k+", l: "customers served" },
            { v: "3×", l: "SMS touchpoints" },
            { v: "< 2min", l: "average setup time" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{s.v}</div>
              <div className="text-xs text-[#8A8A82]">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);
  const items = [
    ["Is Possac really free?", "Yes. Possac is free to start so small teams can run a virtual queue without upfront cost."],
    ["Do customers need to download an app?", "No. Customers join from a normal browser link after scanning your QR code. Nothing to install."],
    ["What happens if a customer loses their link?", "Staff can find them in the live queue and call them by SMS when it is their turn."],
    ["Can I have multiple staff members?", "Yes. Owners can add staff accounts from Settings and each staff member can manage the live queue."],
    ["Does it work without internet for customers?", "Joining and checking status needs internet, but SMS notifications work on any phone once they are in the queue."],
  ];
  return (
    <section className="py-20 sm:py-24 px-5 bg-[#F7F5F0]">
      <div className="mx-auto max-w-3xl">
        <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
          <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">FAQ</p>
          <h2 className="font-display text-[clamp(34px,5vw,52px)] font-bold leading-tight text-[#0E0E0C] mb-10" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
            Questions before<br />you start.
          </h2>
        </div>
        <div className="divide-y divide-[#DDD9D0] rounded-2xl border border-[#DDD9D0] bg-white overflow-hidden">
          {items.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium text-[#0E0E0C] hover:bg-[#F7F5F0] transition-colors">
                <span>{q}</span>
                <span className={`text-[#0F6E56] text-xl transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-7 text-[#7A7A72]">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Landing() {
  useScrollReveal();
  return (
    <div className="route-fade grain min-h-screen bg-[#F7F5F0] overflow-x-hidden">
      <BackToTop />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5F0]/95 backdrop-blur-xl border-b border-[#DDD9D0]">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <PossacLogo />
          <div className="hidden sm:flex items-center gap-6 text-sm text-[#7A7A72]">
            <a href="#how" className="hover:text-[#0E0E0C] transition-colors">How it works</a>
            <a href="#sms" className="hover:text-[#0E0E0C] transition-colors">SMS</a>
            <a href="#sectors" className="hover:text-[#0E0E0C] transition-colors">Who it's for</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm text-[#7A7A72] hover:text-[#0E0E0C] transition-colors px-3 py-1.5 hidden sm:block">Sign in</Link>
            <Link to="/signup" className="shine-hover text-sm font-medium bg-[#0E0E0C] text-white px-4 py-2 rounded-xl hover:bg-[#1a1a16] transition-colors">Start free →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center pt-28 pb-20 px-5">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0F6E56]/6 blur-[100px] pointer-events-none" />
        <div className="relative mx-auto grid max-w-6xl w-full items-center gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2.5 bg-white border border-[#DDD9D0] rounded-full px-4 py-1.5 text-xs text-[#7A7A72] mb-8 shadow-sm">
              <span className="relative h-2 w-2 rounded-full bg-[#0F6E56] animate-pulse" />
              Live in Rwanda · Free to start
            </div>
            <h1 className="animate-fade-up delay-100 text-[clamp(52px,8vw,96px)] leading-[0.95] tracking-[-0.03em] text-[#0E0E0C] max-w-4xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>
              Your customers<br />
              <span className="text-[#0F6E56]">deserve better</span><br />
              than waiting.
            </h1>
            <p className="animate-fade-up delay-200 mt-7 text-[18px] text-[#7A7A72] max-w-lg leading-relaxed font-light">
              Possac gives any business a virtual queue in minutes. Customers scan a QR, wait from anywhere, and come back only when it's their turn.
            </p>
            <div className="animate-fade-up delay-300 mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="shine-hover inline-flex items-center gap-2 bg-[#0F6E56] text-white text-[15px] font-medium px-7 py-3.5 rounded-xl hover:bg-[#0a5a44] transition-all duration-200 shadow-lg shadow-[#0F6E56]/25 hover:shadow-[#0F6E56]/40 hover:-translate-y-0.5">
                Get started — it's free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link to="/login" className="shine-hover inline-flex items-center gap-2 text-[15px] text-[#3A3A35] border border-[#DDD9D0] bg-white px-7 py-3.5 rounded-xl hover:border-[#0F6E56]/40 hover:bg-[#F0FDF9] transition-all duration-200 hover:-translate-y-0.5">
                Sign in
              </Link>
            </div>
            <div className="animate-fade-up delay-400 mt-10 flex flex-wrap gap-3">
              {[
                { v: "< 2 min", l: "to set up" },
                { v: "3×", l: "automatic SMS alerts" },
                { v: "0", l: "apps for customers" },
                { v: "100%", l: "works on any phone" },
              ].map((s) => (
                <div key={s.l} className="bg-white border border-[#DDD9D0] rounded-xl px-4 py-2.5 flex items-baseline gap-2 shadow-sm hover:border-[#0F6E56]/30 transition-colors">
                  <span className="font-bold text-[#0E0E0C] text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>{s.v}</span>
                  <span className="text-xs text-[#7A7A72]">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
          <HeroPhoneMockup />
        </div>
        <div className="animate-fade-in delay-500 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-[#7A7A72] tracking-widest uppercase">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-[#7A7A72] to-transparent" />
        </div>
      </section>

      {/* TICKER */}
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

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 sm:py-28 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
              <div>
                <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">Process</p>
                <h2 className="text-[clamp(36px,5vw,60px)] leading-[1.0] tracking-tight text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                  Up and running<br />in four steps.
                </h2>
              </div>
              <Link to="/signup" className="text-sm text-[#0F6E56] hover:underline">Create your account →</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Create account", d: "Sign up in 2 minutes. Pick your business type and customize your SMS messages. Queue is live immediately.", icon: "M12 4v16m8-8H4", delay: 0 },
              { n: "02", t: "Place QR code", d: "Download and print your unique QR code. Stick it at your entrance. That's the only hardware you need.", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 17h.01M14 14h.01M20 14h.01M14 20h.01M20 20h.01M17 14v.01M14 17v.01M20 17v.01M17 20v.01", delay: 80 },
              { n: "03", t: "Customers join", d: "They scan the QR from their phone, enter their name, and join instantly. No app, no account needed.", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", delay: 160 },
              { n: "04", t: "Call when ready", d: "One tap on your dashboard sends an SMS. They come back exactly when it's their turn. No crowding.", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", delay: 240 },
            ].map((s) => (
              <div key={s.n}
                className="reveal group bg-white border border-[#DDD9D0] rounded-2xl p-6 cursor-default hover:border-[#0F6E56]/30 hover:shadow-lg hover:shadow-[#0F6E56]/5 hover:-translate-y-1 transition-all duration-300"
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${s.delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${s.delay}ms` }}>
                <div className="flex items-start justify-between mb-5">
                  <span className="text-4xl font-extrabold text-[#ECEAE4]" style={{ fontFamily: "'Syne', sans-serif" }}>{s.n}</span>
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

      {/* TWO WAYS */}
      <section className="py-20 sm:py-28 px-5 bg-[#0E0E0C]">
        <div className="mx-auto max-w-6xl">
          <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-medium text-[#2DD4A0] uppercase tracking-[0.2em] mb-3">Flexibility</p>
            <h2 className="text-[clamp(36px,5vw,60px)] leading-[1.0] tracking-tight text-white mb-14" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              Two ways in.<br />One live queue.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h.01M14 17h.01M14 20h.01M17 14h.01M17 17h3v3h-3zM20 14h.01", t: "Customer scans QR", d: "They scan the QR code at your door, type their name, and join. No app, no account, no phone number required. Works on every smartphone.", note: "Works on any smartphone", delay: 0 },
              { icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", t: "Staff adds them", d: "Receptionist enters name and phone in 5 seconds. Works for walk-ins, phone bookings, and customers without smartphones.", note: "Works for every customer", delay: 100 },
            ].map((c) => (
              <div key={c.t}
                className="reveal rounded-2xl border border-white/8 bg-white/5 p-8 hover:bg-white/8 hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${c.delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${c.delay}ms` }}>
                <div className="h-12 w-12 rounded-2xl bg-[#0F6E56]/20 flex items-center justify-center mb-6">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DD4A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>{c.t}</h3>
                <p className="text-[#8A8A82] leading-relaxed text-sm">{c.d}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs text-[#2DD4A0] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4A0]" />
                  {c.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMS */}
      <section id="sms" className="py-20 sm:py-28 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">SMS Notifications</p>
              <h2 className="text-[clamp(36px,4vw,52px)] leading-[1.05] tracking-tight text-[#0E0E0C] mb-6" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
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
                  <div key={s.step} className="flex items-start gap-4 group">
                    <div className="h-7 w-7 rounded-full bg-[#0F6E56]/10 flex items-center justify-center text-xs font-medium text-[#0F6E56] shrink-0 mt-0.5 group-hover:bg-[#0F6E56] group-hover:text-white transition-colors">{s.step}</div>
                    <div>
                      <span className="text-sm font-medium text-[#0E0E0C]">{s.label} — </span>
                      <span className="text-sm text-[#7A7A72]">{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal relative" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease 150ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 150ms" }}>
              <div className="bg-[#0E0E0C] rounded-3xl p-6 space-y-3">
                <div className="text-xs text-[#4A4A42] uppercase tracking-widest mb-5 font-medium">Incoming messages</div>
                {[
                  { time: "Now", body: "Hi Amina, you are #4 at Cuts & Style. Estimated wait: 35 min. We'll alert you when you're close.", tag: "Joined" },
                  { time: "25 min later", body: "Hi Amina, you're 3rd in line at Cuts & Style. Please start making your way back.", tag: "Heads-up" },
                  { time: "10 min later", body: "Hi Amina, it's your turn at Cuts & Style. Please come in now.", tag: "Your turn" },
                ].map((m, i) => (
                  <div key={i}>
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
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#0F6E56]/20 blur-2xl rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* SECTORS */}
      <section id="sectors" className="py-20 sm:py-28 px-5 bg-[#ECEAE4]">
        <div className="mx-auto max-w-6xl">
          <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">Industries</p>
            <h2 className="text-[clamp(36px,5vw,60px)] leading-[1.0] tracking-tight text-[#0E0E0C] mb-12" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              Built for any business<br />with a queue.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { n: "Salons & Barbershops", d: "Keep clients informed while they wait elsewhere." },
              { n: "Pharmacies", d: "Let patients wait comfortably while prescriptions are prepared." },
              { n: "Banks & SACCOs", d: "Reduce crowding in branches during peak hours." },
              { n: "Government offices", d: "Help citizens plan their visit without wasting a full day." },
              { n: "Insurance companies", d: "Manage client flow without a physical waiting room." },
              { n: "Restaurants & cafés", d: "Seat guests when their table is actually ready." },
            ].map((s, i) => (
              <div key={s.n}
                className="reveal bg-white border border-[#DDD9D0] rounded-2xl p-5 cursor-default hover:border-[#0F6E56]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${(i % 3) * 80}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${(i % 3) * 80}ms` }}>
                <div className="h-8 w-8 rounded-lg bg-[#0F6E56]/8 flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={SECTOR_ICONS[s.n] ?? "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"} />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-[#0E0E0C] mb-1">{s.n}</h3>
                <p className="text-xs text-[#7A7A72] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />

      {/* CONTACT */}
      <section className="py-20 sm:py-28 px-5">
        <div className="mx-auto max-w-lg">
          <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-[0.2em] mb-3">Contact</p>
            <h2 className="text-[clamp(32px,4vw,48px)] leading-tight tracking-tight text-[#0E0E0C] mb-4" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              We'd love to<br />hear from you.
            </h2>
            <p className="text-[#7A7A72] mb-10 text-sm">Question about setup, how it works, or want to try it for your business?</p>
          </div>
          <form action="https://formspree.io/f/xbdbongl" method="POST" className="space-y-4">
            <input type="hidden" name="_subject" value="New Possac enquiry" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Full name</label>
                <input type="text" name="name" required placeholder="Your name" className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 h-11 text-sm outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Email</label>
                <input type="email" name="email" required placeholder="your@email.com" className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 h-11 text-sm outline-none focus:border-[#0F6E56] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Subject</label>
              <input type="text" name="subject" required placeholder="What is this about?" className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 h-11 text-sm outline-none focus:border-[#0F6E56] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#3A3A35] block mb-1.5">Message</label>
              <textarea name="message" required rows={4} placeholder="Tell us more..." className="w-full bg-white border border-[#DDD9D0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F6E56] transition-colors resize-none" />
            </div>
            <button type="submit" className="shine-hover w-full bg-[#0F6E56] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#0a5a44] transition-all duration-200 shadow-lg shadow-[#0F6E56]/20 hover:shadow-[#0F6E56]/30 hover:-translate-y-0.5">
              Send message
            </button>
          </form>
          <p className="text-center text-xs text-[#7A7A72] mt-6">
            Or email us at{" "}
            <a href="mailto:hello.possac@gmail.com" className="text-[#0F6E56] hover:underline">hello.possac@gmail.com</a>
          </p>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-5 pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="reveal relative overflow-hidden bg-[#0E0E0C] rounded-3xl px-8 py-16 sm:px-14 sm:py-20 text-center"
            style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0F6E56]/25 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0F6E56]/50 to-transparent" />
            <div className="relative">
              <p className="text-xs font-medium text-[#2DD4A0] uppercase tracking-[0.2em] mb-4">Get started today</p>
              <h2 className="text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-tight text-white mb-5" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                Ready to run<br />a better queue?
              </h2>
              <p className="text-[#8A8A82] text-base max-w-sm mx-auto mb-8">
                Free to start. Set up in under 2 minutes. No technical knowledge needed.
              </p>
              <Link to="/signup" className="shine-hover inline-flex items-center gap-2 bg-white text-[#0E0E0C] px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-[#F0EDE6] transition-all duration-200 hover:-translate-y-0.5 shadow-lg">
                Create your account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 pt-16 pb-10 border-t border-[#DDD9D0]">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            <div>
              <PossacLogo />
              <p className="mt-4 text-sm text-[#7A7A72] leading-relaxed max-w-[220px]">
                Virtual queue management for Rwanda's businesses. Free to start.
              </p>
              <a href="mailto:hello.possac@gmail.com" className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#0F6E56] hover:underline">
                hello.possac@gmail.com
              </a>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0E0E0C] uppercase tracking-widest mb-4">Product</div>
              <div className="space-y-3">
                {[["#how", "How it works"], ["#sms", "SMS notifications"], ["#sectors", "Industries"], ["/signup", "Get started free"]].map(([href, label]) => (
                  <div key={label}>
                    {href.startsWith("#")
                      ? <a href={href} className="text-sm text-[#7A7A72] hover:text-[#0E0E0C] transition-colors">{label}</a>
                      : <Link to={href} className="text-sm text-[#7A7A72] hover:text-[#0E0E0C] transition-colors">{label}</Link>
                    }
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0E0E0C] uppercase tracking-widest mb-4">Account</div>
              <div className="space-y-3">
                {[["/login", "Sign in"], ["/signup", "Create account"]].map(([href, label]) => (
                  <div key={label}>
                    <Link to={href} className="text-sm text-[#7A7A72] hover:text-[#0E0E0C] transition-colors">{label}</Link>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0E0E0C] uppercase tracking-widest mb-4">Legal</div>
              <div className="space-y-3">
                {[["/privacy", "Privacy policy"], ["/terms", "Terms of service"]].map(([href, label]) => (
                  <div key={label}>
                    <Link to={href} className="text-sm text-[#7A7A72] hover:text-[#0E0E0C] transition-colors">{label}</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#DDD9D0]">
            <span className="text-xs text-[#7A7A72]">© 2026 Possac. Built in Rwanda 🇷🇼</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0F6E56] animate-pulse" />
              <span className="text-xs text-[#7A7A72]">Live · Free to start</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
