import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { PossacLogo } from "@/components/Brand";

export default function PrivacyPage() {
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
          <h1 className="font-display text-4xl font-bold text-[#0E0E0C]">Privacy Policy</h1>
          <p className="mt-3 text-sm leading-7 text-[#7A7A72]">
            Possac collects only the information needed to run virtual queues and notify customers.
          </p>

          <Section title="What Data We Collect">
            We may collect customer name, phone number, business name, business profile information, staff profile information, and usage data related to queue activity.
          </Section>
          <Section title="How We Use Data">
            We use data for queue management, SMS notifications, customer status pages, staff dashboards, support, security, and service improvement. SMS notifications are used only for queue-related updates.
          </Section>
          <Section title="Data Sharing">
            We do not sell personal data. We may share limited data with service providers such as SMS delivery and hosting providers only as needed to operate Possac.
          </Section>
          <Section title="Data Retention">
            Queue entries are kept for 90 days and then deleted. Business account data is retained while the account is active unless deletion is requested.
          </Section>
          <Section title="User Rights">
            Customers and business users may request deletion of their data by emailing us. We will respond to reasonable deletion requests subject to legal and operational requirements.
          </Section>
          <Section title="Contact">
            Privacy requests can be sent to <a href="mailto:hello.possac@gmail.com" className="text-[#0F6E56] underline">hello.possac@gmail.com</a>.
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
