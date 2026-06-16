bash

cat > /mnt/user-data/outputs/final-fixes/src/routes/index.tsx << 'ENDOFFILE'
import { useEffect, useState } from "react";
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
      { threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-[#0F6E56] text-white shadow-lg shadow-[#0F6E56]/30 transition-all duration-300 flex items-center justify-center hover:-translate-y-0.5 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}

const TICKER_ITEMS = [
  "Virtual queue", "SMS notifications", "QR code joining", "Zero apps needed",
  "Real-time updates", "Staff dashboard", "Automatic alerts", "Rwanda-built",
  "Virtual queue", "SMS notifications", "QR code joining", "Zero apps needed",
  "Real-time updates", "Staff dashboard", "Automatic alerts", "Rwanda-built",
];

function HeroPhoneMockup() {
  return (
    <div className="hidden lg:flex justify-center items-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-[48px] bg-[#0F6E56]/25 blur-3xl scale-90" />
        <div className="relative h-[560px] w-[270px] rounded-[48px] border-2 border-white/15 bg-[#0A0A08] p-3 shadow-2xl">
          <div className="absolute left-1/2 top-3.5 h-5 w-24 -translate-x-1/2 rounded-full bg-black z-10" />
          <div className="h-full rounded-[38px] bg-[#F7F5F0] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 pt-8 pb-3">
              <div className="text-[10px] font-semibold text-[#0E0E0C]">9:41</div>
              <div className="h-2 w-4 rounded-sm border border-[#0E0E0C]/50 relative"><div className="absolute left-0.5 top-0.5 bottom-0.5 right-1 bg-[#0E0E0C]/50 rounded-sm" /></div>
            </div>
            <div className="flex-1 px-4 pb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-[#9CA3AF]">Possac Queue</div>
                  <div className="text-base font-bold text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>City Clinic</div>
                </div>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F6E56] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0F6E56]" />
                </span>
              </div>
              <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
                <div className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Your position</div>
                <div className="text-5xl font-extrabold text-[#0F6E56] leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>#4</div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#E8F5F1] p-2.5">
                    <div className="text-[9px] text-[#7A7A72]">Ahead</div>
                    <div className="text-sm font-bold text-[#0E0E0C]">3</div>
                  </div>
                  <div className="rounded-xl bg-[#F3F4F6] p-2.5">
                    <div className="text-[9px] text-[#7A7A72]">Wait</div>
                    <div className="text-sm font-bold text-[#0E0E0C]">25m</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-[#0F6E56] rounded-full" />
                </div>
              </div>
              <div className="rounded-2xl bg-[#0F6E56] px-4 py-3 text-white">
                <div className="text-[9px] text-white/60 mb-1">SMS sent</div>
                <p className="text-xs leading-relaxed">You are 3rd in line. Please start making your way back now.</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#0F6E56] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" /></svg>
                </div>
                <div>
                  <div className="text-[9px] text-[#9CA3AF]">Your turn!</div>
                  <div className="text-xs font-semibold text-[#0E0E0C]">Come in now →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);
  const items = [
    ["Is Possac really free?", "Yes. Possac is completely free to start. Any business can set up and run a virtual queue with no upfront cost and no credit card required."],
    ["Do customers need to download an app?", "No. Customers join from a normal browser link after scanning your QR code. Nothing to install, no account needed — it works on every smartphone."],
    ["What happens if a customer loses their link?", "Staff can find them in the live queue by name and manually call them when it is their turn. Nothing is lost."],
    ["Can I have multiple staff members?", "Yes. Business owners can add unlimited staff accounts from the Settings page. Each staff member gets their own login to manage the live queue."],
    ["Does it work without internet for customers?", "Joining and checking queue status requires internet, but the SMS notifications work on any phone once the customer has joined — no internet needed for updates."],
    ["Which businesses can use Possac?", "Any business that has a queue — clinics, salons, pharmacies, banks, SACCOs, government offices, restaurants, and many more. If people wait in line for your service, Possac works for you."],
  ];
  return (
    <section id="faq" className="py-28 px-5 bg-white">
      <div className="mx-auto max-w-4xl">
        <div className="reveal text-center mb-16" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
          <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-[0.25em] mb-4">FAQ</p>
          <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.0] tracking-tight text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>
            Frequently asked <span className="text-[#0F6E56]">questions</span>
          </h2>
        </div>
        <div className="space-y-3">
          {items.map(([q, a], i) => (
            <div key={q} className="reveal border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white hover:border-[#0F6E56]/30 transition-colors"
              style={{ opacity: 0, transform: "translateY(16px)", transition: `opacity 0.5s ease ${i * 50}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms` }}>
              <button onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-7 py-5 text-left hover:bg-[#F7F5F0] transition-colors">
                <span className="text-[15px] font-semibold text-[#0E0E0C]">{q}</span>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${open === i ? "bg-[#0F6E56] rotate-45" : "bg-[#F0EDE6]"}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open === i ? "white" : "#0F6E56"} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="px-7 pb-6 text-sm leading-7 text-[#7A7A72]">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="py-28 px-5 bg-[#F7F5F0]">
      <div className="mx-auto max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-[0.25em] mb-4">Contact</p>
            <h2 className="text-[clamp(36px,4vw,56px)] font-black leading-[1.05] tracking-tight text-[#0E0E0C] mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
              We'd love to<br /><span className="text-[#0F6E56]">hear from you.</span>
            </h2>
            <p className="text-[#7A7A72] leading-relaxed mb-10">
              Have a question about setup, pricing, or want to see Possac live at your business? Drop us a message and we'll get back to you within 24 hours.
            </p>
            <div className="space-y-5">
              {[
                { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Email", value: "hello.possac@gmail.com", href: "mailto:hello.possac@gmail.com" },
                { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Location", value: "Kigali, Rwanda", href: null },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-[#E8F5F1] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={c.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA3AF] uppercase tracking-wider">{c.label}</div>
                    {c.href
                      ? <a href={c.href} className="text-sm font-medium text-[#0E0E0C] hover:text-[#0F6E56] transition-colors">{c.value}</a>
                      : <div className="text-sm font-medium text-[#0E0E0C]">{c.value}</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease 150ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 150ms" }}>
            {sent ? (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-10 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0E0E0C] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Message sent!</h3>
                <p className="text-sm text-[#7A7A72]">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form
                action="https://formspree.io/f/xbdbongl"
                method="POST"
                onSubmit={() => setSent(true)}
                className="bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-sm space-y-5">
                <input type="hidden" name="_subject" value="New Possac enquiry" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider block mb-2">Full name</label>
                    <input type="text" name="name" required placeholder="Your name"
                      className="w-full bg-[#F7F5F0] border border-[#E5E7EB] rounded-xl px-4 h-12 text-sm outline-none focus:border-[#0F6E56] focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider block mb-2">Email</label>
                    <input type="email" name="email" required placeholder="your@email.com"
                      className="w-full bg-[#F7F5F0] border border-[#E5E7EB] rounded-xl px-4 h-12 text-sm outline-none focus:border-[#0F6E56] focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider block mb-2">Business type</label>
                  <select name="business_type"
                    className="w-full bg-[#F7F5F0] border border-[#E5E7EB] rounded-xl px-4 h-12 text-sm outline-none focus:border-[#0F6E56] focus:bg-white transition-all text-[#374151]">
                    <option value="">Select your sector</option>
                    <option>Health facility / Clinic</option>
                    <option>Salon or Barbershop</option>
                    <option>Bank or SACCO</option>
                    <option>Pharmacy</option>
                    <option>Government office</option>
                    <option>Restaurant or Café</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider block mb-2">Message</label>
                  <textarea name="message" required rows={4} placeholder="Tell us about your business and what you'd like to know..."
                    className="w-full bg-[#F7F5F0] border border-[#E5E7EB] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#0F6E56] focus:bg-white transition-all resize-none" />
                </div>
                <button type="submit"
                  className="w-full bg-[#0F6E56] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#0a5a44] transition-all duration-200 shadow-lg shadow-[#0F6E56]/20 hover:shadow-[#0F6E56]/30 hover:-translate-y-0.5">
                  Send message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  useScrollReveal();
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0] overflow-x-hidden">
      <BackToTop />

      {/* NAV — always white, just shadow on scroll */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-200 ${navScrolled ? "shadow-sm border-b border-[#E5E7EB]" : "border-b border-transparent"}`}>
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <PossacLogo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#374151]">
            <a href="#how" className="hover:text-[#0F6E56] transition-colors">How it works</a>
            <a href="#why" className="hover:text-[#0F6E56] transition-colors">Why Possac</a>
            <a href="#sms" className="hover:text-[#0F6E56] transition-colors">SMS</a>
            <a href="#sectors" className="hover:text-[#0F6E56] transition-colors">Who it's for</a>
            <a href="#faq" className="hover:text-[#0F6E56] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-[#374151] hover:text-[#0F6E56] transition-colors hidden sm:block">Sign in</Link>
            <Link to="/signup" className="text-sm font-bold bg-[#0F6E56] text-white px-5 py-2.5 rounded-xl hover:bg-[#0a5a44] transition-all hover:-translate-y-0.5 shadow-md shadow-[#0F6E56]/20">
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — full bleed photo */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Intentionally neutral photo — person using phone, not healthcare-specific */}
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1800&q=85&auto=format&fit=crop&crop=center"
            alt=""
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E0C]/90 via-[#0E0E0C]/75 to-[#0E0E0C]/30" />
        </div>

        <div className="relative mx-auto grid max-w-6xl w-full items-center gap-12 lg:grid-cols-[1.3fr_1fr] px-5 pt-28 pb-20">
          <div>
            {/* Pill badge */}
            <div className="animate-fade-up inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-xs text-white/80 mb-8 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4A0] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2DD4A0]" />
              </span>
              No more physical waiting rooms
            </div>

            <h1 className="animate-fade-up delay-100 text-[clamp(48px,7vw,86px)] leading-[0.93] tracking-[-0.03em] text-white font-black max-w-2xl" style={{ fontFamily: "'Syne', sans-serif" }}>
              Your customers<br />
              <span className="text-[#2DD4A0]">deserve better</span><br />
              than waiting.
            </h1>

            <p className="animate-fade-up delay-200 mt-7 text-lg text-white/65 max-w-xl leading-relaxed font-light">
              Possac gives any business a virtual queue in minutes. Customers scan a QR, wait from anywhere, and receive an SMS when it's their turn.
            </p>

            <div className="animate-fade-up delay-300 mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup"
                className="inline-flex items-center gap-2 bg-[#0F6E56] text-white text-[15px] font-bold px-7 py-4 rounded-xl hover:bg-[#0a5a44] transition-all duration-200 shadow-xl shadow-[#0F6E56]/30 hover:-translate-y-0.5">
                Get started — it's free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <a href="#how"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white/80 border border-white/25 px-7 py-4 rounded-xl hover:bg-white/10 transition-all duration-200">
                See how it works
              </a>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up delay-400 mt-12 flex flex-wrap gap-6">
              {[
                { v: "< 2 min", l: "to set up" },
                { v: "3×", l: "automatic SMS" },
                { v: "0", l: "apps for customers" },
                { v: "100%", l: "works on any phone" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col">
                  <span className="text-2xl font-black text-white leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>{s.v}</span>
                  <span className="text-xs text-white/50 mt-0.5">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          <HeroPhoneMockup />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* TICKER */}
      <div className="border-y border-[#DDD9D0] bg-[#0E0E0C] py-4 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-8 text-xs font-semibold text-white/40 uppercase tracking-[0.2em] shrink-0">
              {item}
              <span className="h-1 w-1 rounded-full bg-[#0F6E56]" />
            </span>
          ))}
        </div>
      </div>

      {/* WHY POSSAC — dark teal, feature cards like Shingiro */}
      <section id="why" className="py-28 px-5 bg-[#003241]">
        <div className="mx-auto max-w-6xl">
          <div className="reveal text-center mb-16" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-bold text-[#2DD4A0] uppercase tracking-[0.25em] mb-4">Why Possac</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.0] tracking-tight text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Why you should <span className="text-[#2DD4A0]">choose us</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", t: "Zero apps needed", d: "Customers join by scanning a QR code. No download, no account, no friction. Works on any smartphone.", highlight: false },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", t: "Up in 2 minutes", d: "Sign up, customize your SMS messages, download your QR code, and your queue is live. That fast.", highlight: true },
              { icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", t: "Automatic SMS alerts", d: "Three messages fire automatically — when they join, when they're close, and when it's their turn.", highlight: false },
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", t: "Real-time dashboard", d: "Your staff sees every customer in the queue live. One tap calls them. Simple enough for anyone.", highlight: false },
              { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", t: "Free to start", d: "No hardware, no setup fee, no monthly subscription to start. Built for businesses of any size.", highlight: false },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", t: "Built for Rwanda", d: "SMS via Pindo, Kinyarwanda support, designed for the way Rwandan businesses actually work.", highlight: false },
            ].map((f, i) => (
              <div key={f.t}
                className={`reveal rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 cursor-default ${f.highlight ? "bg-[#0F6E56] border border-[#0F6E56]" : "bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20"}`}
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${(i % 3) * 80}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${(i % 3) * 80}ms` }}>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-5 ${f.highlight ? "bg-white/20" : "bg-[#0F6E56]/20"}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? "white" : "#2DD4A0"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{f.t}</h3>
                <p className={`text-sm leading-relaxed ${f.highlight ? "text-white/80" : "text-white/55"}`}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — stacked list style like Shingiro */}
      <section id="how" className="py-28 px-5 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="reveal text-center mb-16" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-[0.25em] mb-4">The Process</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.0] tracking-tight text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>
              How it <span className="text-[#0F6E56]">works</span>
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { n: "01", t: "Create your account", d: "Sign up in 2 minutes. Pick your business sector and customize your SMS messages in any language. Your queue is live immediately — no waiting, no approval needed.", delay: 0 },
              { n: "02", t: "Place your QR code", d: "Download and print your unique QR code. Stick it at your entrance, reception desk, or anywhere customers wait. That's the only setup hardware you'll ever need.", delay: 60 },
              { n: "03", t: "Customers join the queue", d: "They scan the QR from their phone, enter their name, and join in seconds. No app to download, no account to create. They get a confirmation SMS immediately.", delay: 120 },
              { n: "04", t: "Call them when ready", d: "When it's their turn, one tap on your dashboard sends an SMS. They come back exactly when needed. No crowding, no confusion, no missed customers.", delay: 180 },
            ].map((s, i) => (
              <div key={s.n}
                className="reveal group flex items-start gap-6 bg-[#F7F5F0] border border-[#E5E7EB] rounded-2xl p-7 hover:border-[#0F6E56]/30 hover:bg-white hover:shadow-lg hover:shadow-[#0F6E56]/5 transition-all duration-300"
                style={{ opacity: 0, transform: "translateY(20px)", transition: `opacity 0.5s ease ${s.delay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${s.delay}ms` }}>
                <div className="text-5xl font-black text-[#E5E7EB] leading-none shrink-0 group-hover:text-[#0F6E56]/20 transition-colors duration-300" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {s.n}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0E0E0C] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{s.t}</h3>
                  <p className="text-sm text-[#7A7A72] leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/signup" className="inline-flex items-center gap-2 bg-[#0F6E56] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#0a5a44] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#0F6E56]/20">
              Start for free →
            </Link>
          </div>
        </div>
      </section>

      {/* SMS SECTION */}
      <section id="sms" className="py-28 px-5 bg-[#F7F5F0]">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-[0.25em] mb-4">SMS Notifications</p>
              <h2 className="text-[clamp(36px,4vw,56px)] font-black leading-[1.05] tracking-tight text-[#0E0E0C] mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
                Customers always know<br /><span className="text-[#0F6E56]">where they stand.</span>
              </h2>
              <p className="text-[#7A7A72] leading-relaxed mb-10">
                Three automatic messages. Fully customizable in Kinyarwanda, English, or French. Works on every phone — no internet required to receive updates.
              </p>
              <div className="space-y-4">
                {[
                  { n: "1", t: "Joined", d: "Instant confirmation with their position and estimated wait time." },
                  { n: "2", t: "Heads-up", d: "Automatic alert when they're a few spots away — time to head back." },
                  { n: "3", t: "Your turn", d: "One tap from staff sends the final call. They come in, you serve them." },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4 group cursor-default">
                    <div className="h-9 w-9 rounded-xl bg-[#E8F5F1] flex items-center justify-center text-sm font-bold text-[#0F6E56] shrink-0 mt-0.5 group-hover:bg-[#0F6E56] group-hover:text-white transition-all duration-200">{s.n}</div>
                    <div className="pt-1.5">
                      <span className="text-sm font-bold text-[#0E0E0C]">{s.t} — </span>
                      <span className="text-sm text-[#7A7A72]">{s.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease 150ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 150ms" }}>
              <div className="bg-[#0E0E0C] rounded-3xl p-7 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-[#4A4A42] uppercase tracking-widest font-semibold">Live messages</div>
                  <div className="h-2 w-2 rounded-full bg-[#0F6E56] animate-pulse" />
                </div>
                {[
                  { time: "Now", body: "Hi Amina, you are #4 at City Clinic. Estimated wait: 35 min. We'll alert you when you're close.", tag: "Joined", color: "bg-[#0F6E56]" },
                  { time: "25 min later", body: "Hi Amina, you're 3rd in line at City Clinic. Please start making your way back.", tag: "Heads-up", color: "bg-[#1a5c48]" },
                  { time: "10 min later", body: "Hi Amina, it's your turn at City Clinic. Please come in now.", tag: "Your turn", color: "bg-[#0F6E56]" },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="text-[10px] text-[#3A3A32] mb-2 uppercase tracking-wider font-medium">{m.time}</div>
                    <div className="flex items-start gap-3">
                      <div className={`flex-1 ${m.color} rounded-2xl rounded-tl-none px-4 py-3`}>
                        <p className="text-sm text-white leading-relaxed">{m.body}</p>
                      </div>
                      <span className="text-[10px] text-[#2DD4A0] bg-[#2DD4A0]/10 border border-[#2DD4A0]/20 px-2.5 py-1.5 rounded-full shrink-0 mt-0.5 whitespace-nowrap font-bold">{m.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section id="sectors" className="py-28 px-5 bg-[#003241]">
        <div className="mx-auto max-w-6xl">
          <div className="reveal text-center mb-16" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-bold text-[#2DD4A0] uppercase tracking-[0.25em] mb-4">Industries</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.0] tracking-tight text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Built for any business<br /><span className="text-[#2DD4A0]">with a queue.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { n: "Health facilities", d: "Help patients wait without crowding reception.", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zm9-3v8m-4-4h8" },
              { n: "Banks & SACCOs", d: "Reduce crowding in branches during peak hours.", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
              { n: "Government offices", d: "Help citizens plan their visit without wasting a full day.", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
              { n: "Salons & Barbershops", d: "Keep clients informed while they wait elsewhere.", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { n: "Pharmacies", d: "Let patients wait comfortably while prescriptions are ready.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              { n: "Insurance companies", d: "Manage client flow without a physical waiting room.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { n: "Restaurants & cafés", d: "Seat guests when their table is actually ready.", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
              { n: "Any business", d: "If people wait in line for your service, Possac works for you.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            ].map((s, i) => (
              <div key={s.n}
                className="reveal group bg-white/5 border border-white/10 rounded-2xl p-5 cursor-default hover:bg-white/10 hover:border-[#2DD4A0]/30 hover:-translate-y-1 transition-all duration-300"
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.5s ease ${(i % 4) * 60}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${(i % 4) * 60}ms` }}>
                <div className="h-10 w-10 rounded-xl bg-[#0F6E56]/20 flex items-center justify-center mb-4 group-hover:bg-[#0F6E56] transition-colors duration-300">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2DD4A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{s.n}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-28 px-5 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="reveal text-center mb-16" style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-[0.25em] mb-4">Social proof</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.0] tracking-tight text-[#0E0E0C]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Trusted by Rwanda's <span className="text-[#0F6E56]">everyday queues.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Aline Mukamana", business: "Salon owner, Remera", initials: "AM", quote: "Our waiting area feels calm now. Clients scan, leave for errands, and come back when the SMS arrives. No more crowding at the door." },
              { name: "Jean Bosco Ndayisaba", business: "Pharmacy manager, Nyamirambo", initials: "JB", quote: "Possac helped us reduce crowding during busy evenings without buying any hardware or training customers on a new app." },
              { name: "Claudine Uwera", business: "SACCO branch lead, Musanze", initials: "CU", quote: "The staff dashboard is simple enough for the whole team. Customers trust the queue because they can check their position anytime." },
            ].map((t, i) => (
              <article key={t.name}
                className="reveal rounded-3xl border border-[#E5E7EB] bg-[#F7F5F0] p-7 hover:border-[#0F6E56]/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms` }}>
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#0F6E56"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p className="text-sm leading-7 text-[#374151] mb-7">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-[#E5E7EB] pt-5">
                  <div className="h-10 w-10 rounded-full bg-[#0F6E56] flex items-center justify-center text-xs font-bold text-white shrink-0">{t.initials}</div>
                  <div>
                    <div className="text-sm font-bold text-[#0E0E0C]">{t.name}</div>
                    <div className="text-xs text-[#0F6E56] font-medium">{t.business}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-[#E5E7EB] pt-16">
            {[
              { v: "500+", l: "businesses onboarded" },
              { v: "12k+", l: "customers served" },
              { v: "3×", l: "SMS touchpoints" },
              { v: "< 2min", l: "average setup" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-4xl font-black text-[#0E0E0C] mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{s.v}</div>
                <div className="text-xs text-[#9CA3AF]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />
      <ContactSection />

      {/* CTA BANNER */}
      <section className="px-5 py-16 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="reveal relative overflow-hidden rounded-3xl bg-[#003241]"
            style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#0F6E56]/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2DD4A0]/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="relative px-10 py-20 sm:px-16 text-center">
              <p className="text-xs font-bold text-[#2DD4A0] uppercase tracking-[0.25em] mb-4">Get started today</p>
              <h2 className="text-[clamp(32px,5vw,60px)] font-black leading-[1.05] tracking-tight text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
                Ready to run<br />a <span className="text-[#2DD4A0]">better queue?</span>
              </h2>
              <p className="text-white/60 text-base max-w-sm mx-auto mb-10">
                Free to start. Set up in under 2 minutes. No technical knowledge needed.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to="/signup" className="inline-flex items-center gap-2 bg-[#0F6E56] text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-[#0a5a44] transition-all duration-200 hover:-translate-y-0.5 shadow-xl shadow-[#0F6E56]/30">
                  Create your account →
                </Link>
                <a href="#contact" className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-medium text-sm hover:bg-white/10 transition-all duration-200">
                  Talk to us first
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 pt-16 pb-10 bg-[#0E0E0C]">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            <div>
              <PossacLogo />
              <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-[220px]">
                Virtual queue management for Rwanda's businesses. Free to start.
              </p>
              <a href="mailto:hello.possac@gmail.com" className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#2DD4A0] hover:underline">
                hello.possac@gmail.com
              </a>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-5">Product</div>
              <div className="space-y-3">
                {[["#how", "How it works"], ["#sms", "SMS notifications"], ["#sectors", "Industries"], ["/signup", "Get started free"]].map(([href, label]) => (
                  <div key={label}>
                    {href.startsWith("#")
                      ? <a href={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</a>
                      : <Link to={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                    }
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-5">Account</div>
              <div className="space-y-3">
                {[["/login", "Sign in"], ["/signup", "Create account"]].map(([href, label]) => (
                  <div key={label}>
                    <Link to={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-5">Legal</div>
              <div className="space-y-3">
                {[["/privacy", "Privacy policy"], ["/terms", "Terms of service"]].map(([href, label]) => (
                  <div key={label}>
                    <Link to={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
            <span className="text-xs text-white/30">© 2026 Possac. Built in Rwanda 🇷🇼</span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E56] animate-pulse" />
              <span className="text-xs text-white/30">Systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
