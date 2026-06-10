import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Disclaimer | Akubrecah KRA Services",
  description: "Important disclaimer about Akubrecah's relationship with the Kenya Revenue Authority and the nature of our service.",
}

export default function DisclaimerPage() {
  const lastUpdated = "10 June 2026"

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Legal Document</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Disclaimer</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Last Updated: {lastUpdated}
        </p>

        {/* Critical disclaimer banner */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mt-4 space-y-2">
          <p className="text-[12px] text-red-400 font-black uppercase tracking-widest">
            ⚠ Not an Official KRA Service
          </p>
          <p className="text-[11px] text-red-300/80 font-medium leading-relaxed">
            Akubrecah is an <strong>independent third-party service</strong> and is <strong>not</strong> the Kenya
            Revenue Authority (KRA), nor is it affiliated with, endorsed by, sponsored by, or in any way officially
            connected to the KRA or the Government of Kenya.
          </p>
        </div>
      </div>

      <Section title="1. Independence from KRA">
        <p>
          Akubrecah (<strong>akubrecah.com</strong>) is a privately owned, independently operated online convenience
          service. We are not an agent, contractor, subsidiary, or representative of the Kenya Revenue Authority (KRA).
        </p>
        <p>
          The KRA's official website is{" "}
          <a href="https://www.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">
            kra.go.ke
          </a>{" "}
          and the official KRA iTax portal is{" "}
          <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">
            itax.kra.go.ke
          </a>. These services are free of charge directly from KRA.
        </p>
        <p>
          Our Service simply automates the process of accessing the publicly available KRA portal on behalf of users
          who consent to and request this assistance. We do not have any special access to KRA systems beyond what
          any registered taxpayer can access themselves.
        </p>
      </Section>

      <Section title="2. Accuracy of Information">
        <p>
          All KRA certificates, PIN information, and taxpayer data retrieved through this Service are sourced
          directly from the KRA's own systems in real time. Akubrecah makes <strong>no representations or
          warranties</strong> regarding the accuracy, completeness, or reliability of such information.
        </p>
        <p>
          Any discrepancies, errors, or outdated information in retrieved documents are the result of KRA's records,
          not this Service. For corrections to KRA records, users should contact KRA directly at{" "}
          <a href="https://www.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">
            kra.go.ke
          </a>.
        </p>
      </Section>

      <Section title="3. No Legal or Tax Advice">
        <p>
          Nothing on this website constitutes <strong>legal, tax, financial, or professional advice</strong>. The
          information and services provided are for general convenience purposes only.
        </p>
        <p>
          For advice on your KRA obligations, tax compliance, returns filing, or any KRA-related legal matters,
          you should consult a qualified tax consultant, certified public accountant, or legal professional
          licensed to practice in Kenya.
        </p>
      </Section>

      <Section title="4. Service Availability">
        <p>
          The availability and functionality of this Service is dependent on the uptime and accessibility of the
          KRA portal. We have no control over KRA system outages, maintenance periods, or changes to KRA's website
          structure.
        </p>
        <p>
          Akubrecah does not guarantee uninterrupted service availability and shall not be liable for any loss or
          inconvenience caused by KRA system downtime or changes.
        </p>
      </Section>

      <Section title="5. User Responsibility">
        <p>
          By using this Service, you acknowledge that:
        </p>
        <ul>
          <li>You are the rightful owner of the credentials you submit</li>
          <li>You have chosen to use this third-party convenience service voluntarily</li>
          <li>You understand this Service charges a convenience fee for the assistance it provides</li>
          <li>You remain solely responsible for your own KRA compliance and obligations</li>
          <li>You can access KRA services directly at no cost via KRA's official portals</li>
        </ul>
      </Section>

      <Section title="6. External Links">
        <p>
          This website may contain links to third-party websites, including the KRA official portal. These links are
          provided for your convenience only. Akubrecah has no control over the content of those sites and accepts
          no responsibility for them or for any loss or damage that may arise from your use of them.
        </p>
      </Section>

      <Section title="7. Regulatory Compliance">
        <p>
          This Service operates in compliance with:
        </p>
        <ul>
          <li>The Data Protection Act, 2019 (Kenya)</li>
          <li>The Computer Misuse and Cybercrimes Act, 2018 (Kenya)</li>
          <li>The Consumer Protection Act, 2012 (Kenya)</li>
          <li>The Information and Communications Technology Act (Kenya)</li>
        </ul>
        <p>
          If you believe this Service is operating in breach of any applicable law, please contact us immediately
          at <strong>legal@akubrecah.com</strong>.
        </p>
      </Section>

      <Section title="8. Contact">
        <ul>
          <li><strong>Legal:</strong> legal@akubrecah.com</li>
          <li><strong>Support:</strong> support@akubrecah.com</li>
          <li><strong>Website:</strong> akubrecah.com</li>
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-foreground border-l-2 border-amber-400 pl-4">
        {title}
      </h2>
      <div className="space-y-3 text-[12px] text-muted-foreground leading-relaxed pl-4 [&_strong]:text-foreground [&_strong]:font-bold [&_a]:text-amber-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}
