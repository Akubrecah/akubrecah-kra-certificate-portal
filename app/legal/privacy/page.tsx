import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Akubrecah KRA Services",
  description: "How Akubrecah collects, uses, and protects your personal data in compliance with Kenya's Data Protection Act 2019.",
}

export default function PrivacyPolicyPage() {
  const lastUpdated = "10 June 2026"

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-outline-variant pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Legal Document</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Privacy Policy</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Last Updated: {lastUpdated} &nbsp;·&nbsp; Effective Date: {lastUpdated}
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
          <p className="text-[11px] text-primary font-bold uppercase tracking-wide">
            ⚖️ This policy is governed by the Kenya Data Protection Act, 2019 (No. 24 of 2019) and the Data Protection (General) Regulations, 2021.
          </p>
        </div>
      </div>

      <Section title="1. Who We Are">
        <p>
          Akubrecah ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates the website at{" "}
          <strong>akubrecah.com</strong> and its subdomains (the "<strong>Service</strong>"). We provide an independent
          third-party convenience service for retrieving Kenya Revenue Authority (KRA) PIN and Compliance Certificates.
          We are <strong>not affiliated with, endorsed by, or officially connected to the Kenya Revenue Authority</strong>.
        </p>
        <p>
          For the purposes of the Kenya Data Protection Act 2019, Akubrecah acts as the <strong>Data Controller</strong>{" "}
          for personal data you provide through this Service.
        </p>
        <p>
          Contact: <strong>privacy@akubrecah.com</strong>
        </p>
      </Section>

      <Section title="2. Data We Collect">
        <p>We collect only the minimum data required to perform the requested service:</p>
        <ul>
          <li><strong>Identity data:</strong> National ID number or KRA PIN number</li>
          <li><strong>Contact data:</strong> Email address, phone number (when provided)</li>
          <li><strong>Account data:</strong> Name, username, password (hashed) — stored via Clerk authentication</li>
          <li><strong>Document data:</strong> National ID images uploaded for the Change Particulars service</li>
          <li><strong>Usage data:</strong> Anonymous analytics via Vercel Analytics (no cookies, no personal identifiers)</li>
          <li><strong>Session data:</strong> Temporary session tokens for CAPTCHA processing — deleted immediately after use</li>
        </ul>
        <p>
          We do <strong>not</strong> collect: payment card data, biometric data, or sensitive personal data as defined under Section 2 of the Data Protection Act 2019.
        </p>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>We process your data solely for the following purposes (lawful basis in brackets):</p>
        <ul>
          <li>Retrieving your KRA PIN Certificate or Compliance Certificate from the KRA portal on your behalf <em>[Performance of a contract / Your explicit consent]</em></li>
          <li>Processing Change of Particulars requests with KRA Support Portal <em>[Your explicit consent]</em></li>
          <li>Maintaining your user account and authentication <em>[Performance of a contract]</em></li>
          <li>Improving and monitoring the performance of our Service <em>[Legitimate interest]</em></li>
          <li>Complying with legal obligations under Kenyan law <em>[Legal obligation]</em></li>
        </ul>
      </Section>

      <Section title="4. Data Retention &amp; Deletion">
        <ul>
          <li><strong>Session data &amp; CAPTCHA tokens:</strong> Deleted immediately after each request is processed (within seconds).</li>
          <li><strong>ID document uploads:</strong> Deleted from our servers within <strong>24 hours</strong> of the Change Particulars request being submitted to KRA.</li>
          <li><strong>KRA retrieval results:</strong> Never stored. Results are generated and served directly to you in-session only.</li>
          <li><strong>Account data:</strong> Retained while your account is active. You may delete your account at any time.</li>
        </ul>
        <p>
          We do not maintain databases of KRA certificates, PIN numbers, or personal details retrieved through this Service.
        </p>
      </Section>

      <Section title="5. Data Sharing &amp; Third Parties">
        <p>We share your data with:</p>
        <ul>
          <li>
            <strong>Kenya Revenue Authority (KRA)</strong> — your ID/PIN is transmitted to KRA's systems solely to
            retrieve your requested document. We act as your authorised agent for this purpose.
          </li>
          <li>
            <strong>Clerk (clerk.com)</strong> — authentication provider. Processes account registration, login, and
            session management. Subject to their Privacy Policy.
          </li>
          <li>
            <strong>Supabase</strong> — database and file storage provider. Data stored in Supabase is encrypted at rest.
          </li>
          <li>
            <strong>Vercel</strong> — hosting provider. Collects anonymous performance analytics with no personal
            identifiers.
          </li>
        </ul>
        <p>
          We <strong>do not sell, rent, trade, or otherwise disclose</strong> your personal data to any other third party
          for marketing or commercial purposes.
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We implement appropriate technical and organisational measures to protect your data, including:
        </p>
        <ul>
          <li>HTTPS/TLS encryption for all data in transit</li>
          <li>AES-256 encryption for data stored at rest</li>
          <li>No logging or persistent storage of KRA credentials</li>
          <li>Immediate deletion of temporary session tokens</li>
          <li>Access controls limiting employee access to personal data</li>
        </ul>
        <p>
          However, no internet-based service can guarantee absolute security. In the event of a data breach affecting
          your rights, we will notify you and the Office of the Data Protection Commissioner (ODPC) within <strong>72 hours</strong>{" "}
          as required under Section 43 of the Data Protection Act 2019.
        </p>
      </Section>

      <Section title="7. Your Rights Under the Data Protection Act 2019">
        <p>As a data subject, you have the following rights:</p>
        <ul>
          <li><strong>Right to access</strong> — request a copy of your personal data we hold (Section 26)</li>
          <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data (Section 27)</li>
          <li><strong>Right to erasure</strong> — request deletion of your data (Section 28)</li>
          <li><strong>Right to restrict processing</strong> — limit how we use your data (Section 29)</li>
          <li><strong>Right to data portability</strong> — receive your data in a portable format (Section 30)</li>
          <li><strong>Right to object</strong> — object to processing based on legitimate interests (Section 31)</li>
          <li><strong>Right to withdraw consent</strong> — at any time where processing is based on consent</li>
        </ul>
        <p>
          To exercise any right, email us at <strong>privacy@akubrecah.com</strong>. We will respond within <strong>21 days</strong> as
          required by law. You may also lodge a complaint with the{" "}
          <strong>Office of the Data Protection Commissioner (ODPC)</strong> at{" "}
          <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
            odpc.go.ke
          </a>.
        </p>
      </Section>

      <Section title="8. Cookies &amp; Tracking">
        <p>
          This Service uses <strong>Vercel Analytics</strong>, which is cookieless and does not track individual users
          or store personal information. No advertising or third-party tracking cookies are used.
        </p>
        <p>
          Authentication cookies set by <strong>Clerk</strong> are strictly necessary for logging in and maintaining
          your session. These cannot be opted out of while using the authenticated portions of the Service.
        </p>
        <p>
          See our <a href="/legal/cookies" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">Cookie Policy</a> for full details.
        </p>
      </Section>

      <Section title="9. International Transfers">
        <p>
          Your data may be processed in servers located outside Kenya (including the United States and European Union)
          by our third-party providers (Clerk, Supabase, Vercel). Where such transfers occur, we ensure appropriate
          safeguards are in place consistent with Section 48 of the Data Protection Act 2019.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated via a notice on
          our website and, where possible, by email to registered users. Continued use of the Service after the
          effective date constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          For any privacy-related queries or to exercise your rights:
        </p>
        <ul>
          <li><strong>Email:</strong> privacy@akubrecah.com</li>
          <li><strong>Website:</strong> akubrecah.com</li>
          <li><strong>Postal Address:</strong> Nairobi, Kenya</li>
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
