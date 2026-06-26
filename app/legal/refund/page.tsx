import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy | Akubrecah KRA Services",
  description: "Akubrecah's policy on service fees, refunds, and payment disputes.",
}

export default function RefundPolicyPage() {
  const lastUpdated = "10 June 2026"

  return (
    <div className="space-y-10">
      <div className="space-y-3 border-b border-outline-variant pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Legal Document</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Refund Policy</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Last Updated: {lastUpdated}
        </p>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 mt-4">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide">
            This policy applies to all paid services offered by Akubrecah and is governed by the Consumer Protection
            Act, 2012 (Kenya).
          </p>
        </div>
      </div>

      <Section title="1. Service Fees">
        <p>
          Akubrecah charges a <strong>convenience fee</strong> for automating KRA certificate retrieval and
          Change of Particulars requests on your behalf. Fees, where applicable, are displayed clearly before you
          confirm and pay for a service. By proceeding with payment, you acknowledge and accept the stated fee.
        </p>
        <p>
          All fees are inclusive of applicable taxes unless otherwise stated. Fees are denominated in{" "}
          <strong>Kenyan Shillings (KES)</strong>.
        </p>
        <p>
          Note: KRA services themselves are available <strong>free of charge</strong> directly from the KRA portal
          at{" "}
          <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
            itax.kra.go.ke
          </a>. Akubrecah's fee is solely for the convenience and automation service we provide.
        </p>
      </Section>

      <Section title="2. When You Are Eligible for a Refund">
        <p>You are entitled to a full refund if:</p>
        <ul>
          <li>
            <strong>Service failure:</strong> Our system completely failed to initiate or complete the retrieval
            process due to a bug or error on our end, and no certificate was delivered.
          </li>
          <li>
            <strong>Duplicate charge:</strong> You were charged more than once for the same service due to a
            payment processing error.
          </li>
          <li>
            <strong>Extended unavailability:</strong> The service was down for more than <strong>48 hours</strong>{" "}
            after your payment and you did not receive the service.
          </li>
        </ul>
      </Section>

      <Section title="3. When You Are NOT Eligible for a Refund">
        <p>Refunds will <strong>not</strong> be issued in the following circumstances:</p>
        <ul>
          <li>
            The service was successfully completed and your certificate or confirmation was delivered, even if you
            are dissatisfied with KRA's underlying data (e.g. wrong address on file at KRA).
          </li>
          <li>
            The retrieval failed due to <strong>incorrect credentials</strong> provided by you (wrong ID number,
            incorrect KRA PIN, wrong CAPTCHA answers).
          </li>
          <li>
            Failure caused by <strong>KRA system outages, maintenance, or changes</strong> to the KRA portal that
            are beyond our control.
          </li>
          <li>
            You changed your mind after the service was initiated or partially completed.
          </li>
          <li>
            Your account was suspended or terminated due to a violation of our Terms of Service.
          </li>
          <li>
            More than <strong>14 days</strong> have passed since the transaction date.
          </li>
        </ul>
      </Section>

      <Section title="4. How to Request a Refund">
        <p>To request a refund:</p>
        <ul>
          <li>Email us at <strong>support@akubrecah.com</strong> within <strong>14 days</strong> of your transaction</li>
          <li>Use the subject line: <strong>REFUND REQUEST – [your transaction reference]</strong></li>
          <li>Include: your full name, the email address on your account, transaction date, and reason for the refund request</li>
        </ul>
        <p>
          We will acknowledge your request within <strong>3 business days</strong> and resolve it within{" "}
          <strong>10 business days</strong>. If approved, the refund will be returned to your original payment method.
        </p>
      </Section>

      <Section title="5. Chargebacks & Payment Disputes">
        <p>
          If you initiate a chargeback with your bank or payment provider without first contacting us, we reserve
          the right to suspend your account pending investigation. We cooperate fully with payment processors and
          banks in dispute resolution.
        </p>
        <p>
          Filing a fraudulent chargeback for a legitimately completed service may result in permanent account
          suspension and, in serious cases, reporting to relevant authorities under the{" "}
          <strong>Computer Misuse and Cybercrimes Act 2018</strong>.
        </p>
      </Section>

      <Section title="6. Consumer Protection Rights">
        <p>
          Nothing in this Refund Policy limits or excludes your statutory rights under the{" "}
          <strong>Consumer Protection Act, 2012 (Kenya)</strong>. If you believe your consumer rights have been
          violated, you may contact the <strong>Competition Authority of Kenya (CAK)</strong> at{" "}
          <a href="https://www.cak.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
            cak.go.ke
          </a>.
        </p>
      </Section>

      <Section title="7. Contact">
        <ul>
          <li><strong>Email:</strong> support@akubrecah.com</li>
          <li><strong>Response time:</strong> 3 business days</li>
          <li><strong>Refund window:</strong> 14 days from transaction</li>
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
      <div className="space-y-3 text-[12px] text-muted-foreground leading-relaxed pl-4 [&_strong]:text-foreground [&_strong]:font-bold [&_a]:text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}
