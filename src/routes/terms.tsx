import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { PossacLogo } from "@/components/Brand";

export default function TermsPage() {
  return (
    <div className="route-fade min-h-screen bg-[#F7F5F0]">
      <header className="border-b border-[#DDD9D0] bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <PossacLogo />
          <Link to="/" className="text-sm font-medium text-[#0F6E56] hover:underline">Back home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <article className="rounded-2xl border border-[#DDD9D0] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-medium text-[#0F6E56]">Effective date: June 1, 2026</p>
          <h1 className="font-display mt-3 text-4xl font-bold text-[#0E0E0C]">Terms and Conditions</h1>

          <Section title="1. Service Description">
            Possac is a virtual queue management SaaS platform for businesses. It helps businesses create queues, add customers, let customers join by QR code, and send SMS queue notifications.
          </Section>
          <Section title="2. User Accounts and Responsibilities">
            You are responsible for keeping your account secure, ensuring staff use Possac appropriately, and making sure business and customer information entered into Possac is accurate and lawful.
          </Section>
          <Section title="3. Acceptable Use">
            You may not use Possac to send spam, harassing messages, unlawful content, misleading queue information, or any content that violates applicable law or telecom rules.
          </Section>
          <Section title="4. SMS Messaging Terms">
            Possac may use Pindo API or similar providers to send SMS notifications in Rwanda. You are responsible for obtaining any customer consent required by Rwanda regulations and for using SMS templates only for queue-related communication.
          </Section>
          <Section title="5. Data Privacy">
            Possac collects information needed to operate queues, including customer name, customer phone number, business information, staff profile information, and service usage data. See our Privacy Policy for more detail.
          </Section>
          <Section title="6. No Warranty">
            Possac is provided as is and as available. We do not guarantee uninterrupted service, message delivery, or error-free operation.
          </Section>
          <Section title="7. Limitation of Liability">
            To the maximum extent permitted by law, Possac is not liable for indirect, incidental, consequential, or business interruption damages arising from use of the service.
          </Section>
          <Section title="8. Governing Law">
            These terms are governed by the laws of the Republic of Rwanda.
          </Section>
          <Section title="9. Contact">
            Questions about these terms can be sent to <a href="mailto:hello.possac@gmail.com" className="text-[#0F6E56] underline">hello.possac@gmail.com</a>.
          </Section>
        </article>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-[#DDD9D0] pt-6">
      <h2 className="font-display text-xl font-semibold text-[#0E0E0C]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#3A3A35]">{children}</p>
    </section>
  );
}
