import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Akubrecah KRA Services",
  description: "Terms and conditions governing the use of Akubrecah's KRA certificate retrieval services.",
}

export default function TermsOfServicePage() {
  const lastUpdated = "10 June 2026"

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-outline-variant pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Legal Document</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Terms of Service</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Last Updated: {lastUpdated} &nbsp;·&nbsp; Effective Date: {lastUpdated}
        </p>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 mt-4">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide">
            Please read these Terms carefully before using our Service. By accessing or using Akubrecah, you agree to be bound by these Terms.
          </p>
        </div>
      </div>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using the Akubrecah website and services (the "<strong>Service</strong>"), you agree to be
          legally bound by these Terms of Service ("<strong>Terms</strong>"). If you do not agree to all of these
          Terms, you must not use the Service.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you ("<strong>User</strong>", "<strong>you</strong>")
          and Akubrecah ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>").
        </p>
      </Section>

      <Section title="2. Nature of Service">
        <p>
          Akubrecah provides an <strong>independent, third-party convenience service</strong> that assists users in
          retrieving KRA PIN Certificates and Tax Compliance Certificates from the Kenya Revenue Authority (KRA) portal,
          and submitting Change of Particulars requests on users' behalf.
        </p>
        <p>
          <strong>Important:</strong> Akubrecah is <strong>not</strong> the Kenya Revenue Authority. We are not
          an official KRA service, agent, or representative. We are not affiliated with, endorsed by, or approved by
          the Kenya Revenue Authority. The KRA's official portal is{" "}
          <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
            itax.kra.go.ke
          </a>.
        </p>
        <p>
          This Service is a convenience tool only. You remain fully responsible for your own KRA obligations,
          filings, and compliance.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <p>You must meet the following requirements to use the Service:</p>
        <ul>
          <li>You must be at least <strong>18 years of age</strong></li>
          <li>You must be the <strong>lawful owner</strong> of the KRA PIN or National ID number you submit</li>
          <li>You must <strong>not</strong> use this Service to retrieve certificates for another person without their explicit written consent</li>
          <li>You must have the legal capacity to enter into a binding contract under Kenyan law</li>
        </ul>
        <p>
          By using this Service, you represent and warrant that you meet all of the above requirements. Misuse of this
          Service to access another person's KRA information without authorisation may constitute an offence under
          the Computer Misuse and Cybercrimes Act 2018 and the Data Protection Act 2019.
        </p>
      </Section>

      <Section title="4. User Obligations">
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate, complete, and truthful information when using the Service</li>
          <li>Only submit your own personal credentials (ID number, KRA PIN)</li>
          <li>Keep your account credentials confidential and not share them with third parties</li>
          <li>Notify us immediately at <strong>support@akubrecah.com</strong> if you suspect unauthorised use of your account</li>
          <li>Use the Service only for lawful purposes</li>
          <li>Not attempt to reverse-engineer, scrape, or disrupt the Service</li>
          <li>Not use automated bots or scripts to access the Service</li>
        </ul>
      </Section>

      <Section title="5. Fees & Payments">
        <p>
          Details of applicable service fees, if any, will be clearly disclosed before you complete a transaction.
          All fees are in <strong>Kenyan Shillings (KES)</strong> unless otherwise stated.
        </p>
        <p>
          Fees, once paid for a completed service, are <strong>non-refundable</strong> unless the Service failed to
          deliver the requested document due to an error on our part. Refunds are assessed on a case-by-case basis at
          our sole discretion.
        </p>
      </Section>

      <Section title="6. Intellectual Property">
        <p>
          All content on the Akubrecah website — including design, text, graphics, logos, and code — is the property
          of Akubrecah and is protected by Kenyan and international intellectual property laws. You may not reproduce,
          distribute, or create derivative works without our express written permission.
        </p>
        <p>
          KRA certificates, once retrieved, belong to you as the taxpayer. We claim no ownership over documents
          retrieved from KRA on your behalf.
        </p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable Kenyan law, Akubrecah and its directors, employees, and
          agents shall not be liable for:
        </p>
        <ul>
          <li>Any failure, delay, or error caused by the KRA's own systems, downtime, or changes to the KRA portal</li>
          <li>Inaccuracies in certificates issued by KRA</li>
          <li>Any loss arising from your use or inability to use the Service</li>
          <li>Indirect, incidental, special, consequential, or punitive damages</li>
          <li>Loss of data, loss of profits, or business interruption</li>
          <li>Actions taken by KRA based on information retrieved through this Service</li>
        </ul>
        <p>
          Our total liability to you for any claim arising from use of the Service shall not exceed the amount you
          paid us for the specific transaction giving rise to the claim, or <strong>KES 1,000</strong>, whichever
          is greater.
        </p>
      </Section>

      <Section title="8. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless Akubrecah and its affiliates, directors, officers,
          employees, and agents from and against any claims, liabilities, damages, losses, and expenses — including
          legal fees — arising out of or in connection with:
        </p>
        <ul>
          <li>Your use or misuse of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any applicable law or regulation</li>
          <li>Your submission of false or fraudulent information</li>
          <li>Any third-party claim resulting from your use of the Service</li>
        </ul>
      </Section>

      <Section title="9. Disclaimer of Warranties">
        <p>
          The Service is provided on an "<strong>as is</strong>" and "<strong>as available</strong>" basis, without
          any warranties of any kind, either express or implied, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p>
          We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) results obtained will
          be accurate or reliable; or (c) the quality of any services obtained will meet your expectations.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We reserve the right to suspend or terminate your access to the Service at any time, without notice, if
          you breach these Terms or if we reasonably suspect fraudulent or unlawful activity.
        </p>
        <p>
          You may terminate your account at any time by contacting us at <strong>support@akubrecah.com</strong>.
          Termination does not affect any rights or obligations that arose before termination.
        </p>
      </Section>

      <Section title="11. Governing Law & Dispute Resolution">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of Kenya</strong>.
          Any dispute arising from these Terms shall first be attempted to be resolved through good-faith negotiation.
          If unresolved within 30 days, disputes shall be subject to the exclusive jurisdiction of the{" "}
          <strong>courts of Nairobi, Kenya</strong>.
        </p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>
          We reserve the right to modify these Terms at any time. Updated Terms will be posted with a revised
          "Last Updated" date. Your continued use of the Service after changes are posted constitutes your
          acceptance of the modified Terms. We will provide reasonable notice of material changes.
        </p>
      </Section>

      <Section title="13. Severability">
        <p>
          If any provision of these Terms is found to be unenforceable or invalid by a court of competent
          jurisdiction, such provision shall be limited or eliminated to the minimum extent necessary so that
          the remaining Terms remain in full force and effect.
        </p>
      </Section>

      <Section title="14. Contact">
        <ul>
          <li><strong>Email:</strong> support@akubrecah.com</li>
          <li><strong>Website:</strong> akubrecah.com</li>
          <li><strong>Location:</strong> Nairobi, Kenya</li>
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-foreground border-l-2 border-primary pl-4">
        {title}
      </h2>
      <div className="space-y-3 text-[12px] text-muted-foreground leading-relaxed pl-4 [&_strong]:text-foreground [&_strong]:font-bold [&_a]:text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_em]:text-muted-foreground/70">
        {children}
      </div>
    </section>
  )
}
