import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Akubrecah KRA Services",
  description: "Rules governing acceptable and prohibited use of Akubrecah's KRA certificate retrieval services.",
}

export default function AcceptableUsePolicyPage() {
  const lastUpdated = "10 June 2026"

  return (
    <div className="space-y-10">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Legal Document</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Acceptable Use Policy</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Last Updated: {lastUpdated}
        </p>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mt-4">
          <p className="text-[11px] text-orange-400 font-bold uppercase tracking-wide">
            Violations of this policy may result in immediate account termination and may be reported to
            law enforcement authorities.
          </p>
        </div>
      </div>

      <Section title="1. Purpose">
        <p>
          This Acceptable Use Policy ("<strong>AUP</strong>") defines the rules for lawful and appropriate use of
          the Akubrecah platform. It applies to all users, visitors, and account holders. This AUP supplements
          and is incorporated into our{" "}
          <a href="/legal/terms" className="text-amber-400 underline underline-offset-4">Terms of Service</a>.
        </p>
      </Section>

      <Section title="2. Permitted Use">
        <p>You may use Akubrecah solely to:</p>
        <ul>
          <li>
            Retrieve <strong>your own</strong> KRA PIN Certificate or Tax Compliance Certificate, using your own
            National ID or KRA PIN
          </li>
          <li>
            Submit a Change of Particulars request to KRA using <strong>your own</strong> credentials, on your own
            behalf
          </li>
          <li>Access information about KRA compliance services provided on this platform</li>
          <li>
            Manage your own Akubrecah user account
          </li>
        </ul>
      </Section>

      <Section title="3. Prohibited Use">
        <p>
          The following activities are <strong>strictly prohibited</strong> and may result in immediate account
          suspension, legal action, or reporting to relevant Kenyan authorities:
        </p>

        <div className="space-y-5">
          <ProhibitionBlock
            number="3.1"
            title="Unauthorised Access to Third-Party Data"
            items={[
              "Submitting another person's National ID, KRA PIN, or personal details without their explicit written consent",
              "Retrieving KRA certificates or information belonging to another individual, company, or entity",
              "Impersonating another taxpayer or creating accounts under false identities",
            ]}
            law="Computer Misuse and Cybercrimes Act, 2018 — Sections 22, 23 (Unauthorised access, interception)"
          />

          <ProhibitionBlock
            number="3.2"
            title="Fraud & Misrepresentation"
            items={[
              "Providing false, inaccurate, or misleading personal information",
              "Using forged or altered identification documents",
              "Submitting fraudulent Change of Particulars requests",
              "Using this service to generate false or misleading tax compliance documents",
            ]}
            law="Penal Code (Cap. 63) — Forgery, fraud offences"
          />

          <ProhibitionBlock
            number="3.3"
            title="Automated & Bulk Abuse"
            items={[
              "Using bots, scripts, crawlers, or automated tools to interact with the Service",
              "Bulk retrieval of KRA data for any commercial data harvesting purpose",
              "Reverse engineering, decompiling, or scraping the platform",
              "Circumventing rate limits, CAPTCHAs, or security controls",
            ]}
            law="Computer Misuse and Cybercrimes Act, 2018 — Section 16 (Illegal interception)"
          />

          <ProhibitionBlock
            number="3.4"
            title="Commercial Resale & Unauthorised Distribution"
            items={[
              "Reselling access to the Akubrecah platform without written authorisation",
              "Offering KRA certificate retrieval services to third parties using your Akubrecah account",
              "Distributing, selling, or sharing KRA data retrieved through this Service to any third party",
            ]}
            law="Terms of Service, Section 6 (Intellectual Property)"
          />

          <ProhibitionBlock
            number="3.5"
            title="Platform Interference"
            items={[
              "Attempting to overload, crash, or disrupt the Service through denial-of-service attacks",
              "Uploading malicious files, malware, or code through any upload feature",
              "Exploiting security vulnerabilities without responsible disclosure",
              "Injecting false data into the Service to generate inaccurate documents",
            ]}
            law="Computer Misuse and Cybercrimes Act, 2018 — Sections 14, 15"
          />

          <ProhibitionBlock
            number="3.6"
            title="Identity & Credential Abuse"
            items={[
              "Sharing your Akubrecah login credentials with others",
              "Creating multiple accounts to circumvent restrictions or bans",
              "Using another person's account without their authorisation",
            ]}
            law="Data Protection Act, 2019 — Data subject rights"
          />
        </div>
      </Section>

      <Section title="4. Consequences of Violation">
        <p>If we determine, in our sole discretion, that you have violated this AUP, we may:</p>
        <ul>
          <li>Immediately suspend or permanently terminate your account without notice</li>
          <li>Cancel any pending service requests without refund</li>
          <li>Report the violation to the relevant law enforcement authorities in Kenya</li>
          <li>
            Refer the matter to the <strong>Office of the Data Protection Commissioner (ODPC)</strong> where
            data protection violations are involved
          </li>
          <li>Pursue civil or criminal legal remedies available under Kenyan law</li>
          <li>Preserve and disclose any data required for law enforcement investigations</li>
        </ul>
      </Section>

      <Section title="5. Reporting Violations">
        <p>
          If you become aware of any misuse of the Akubrecah platform, or if you believe your personal KRA data
          has been accessed without your consent through this Service, please report it immediately to:
        </p>
        <ul>
          <li><strong>Email:</strong> security@akubrecah.com</li>
          <li><strong>Data Protection Commissioner:</strong>{" "}
            <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">
              odpc.go.ke
            </a>
          </li>
          <li><strong>Kenya Police Service:</strong> 999 / 0800 722 203</li>
        </ul>
      </Section>

      <Section title="6. Responsible Disclosure">
        <p>
          If you discover a security vulnerability in our platform, we ask that you report it to us
          responsibly at <strong>security@akubrecah.com</strong> before public disclosure. We commit to
          acknowledging your report within 48 hours and resolving confirmed vulnerabilities promptly. We will
          not take legal action against good-faith security researchers who follow responsible disclosure.
        </p>
      </Section>

      <Section title="7. Updates to this Policy">
        <p>
          We reserve the right to update this AUP at any time. Changes are effective when posted. Continued
          use of the Service constitutes acceptance of the updated AUP.
        </p>
      </Section>

      <Section title="8. Contact">
        <ul>
          <li><strong>General:</strong> support@akubrecah.com</li>
          <li><strong>Security:</strong> security@akubrecah.com</li>
          <li><strong>Legal:</strong> legal@akubrecah.com</li>
        </ul>
      </Section>
    </div>
  )
}

function ProhibitionBlock({
  number, title, items, law
}: {
  number: string
  title: string
  items: string[]
  law: string
}) {
  return (
    <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-[9px] font-black text-red-400 font-mono mt-0.5">{number}</span>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-red-300">{title}</h3>
      </div>
      <ul className="list-disc pl-8 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-muted-foreground">{item}</li>
        ))}
      </ul>
      <p className="text-[9px] text-red-400/70 font-bold uppercase tracking-wide pl-1 pt-1 border-t border-red-500/10">
        Applicable law: {law}
      </p>
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
