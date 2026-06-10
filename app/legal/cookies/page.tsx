import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy | Akubrecah KRA Services",
  description: "Information about how Akubrecah uses cookies and similar tracking technologies.",
}

export default function CookiePolicyPage() {
  const lastUpdated = "10 June 2026"

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Legal Document</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Cookie Policy</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Last Updated: {lastUpdated}
        </p>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mt-4">
          <p className="text-[11px] text-green-400 font-bold uppercase tracking-wide">
            ✓ We use minimal cookies. We do not use advertising cookies or sell your browsing data.
          </p>
        </div>
      </div>

      <Section title="1. What Are Cookies">
        <p>
          Cookies are small text files stored on your device when you visit a website. They allow the website to
          remember your preferences and actions over time. Similar technologies include local storage, session
          storage, and browser fingerprinting.
        </p>
      </Section>

      <Section title="2. Cookies We Use">
        <p>We use a minimal set of cookies, categorised as follows:</p>

        <div className="space-y-4">
          <CookieCategory
            type="Strictly Necessary"
            color="green"
            canOptOut={false}
            description="Required for the Service to function. You cannot opt out of these."
            cookies={[
              { name: "__session", provider: "Clerk (clerk.com)", purpose: "Maintains your authenticated login session", duration: "Session / 7 days" },
              { name: "__client_uat", provider: "Clerk (clerk.com)", purpose: "User authentication token for secure sign-in", duration: "Session" },
              { name: "__clerk_db_jwt", provider: "Clerk (clerk.com)", purpose: "Ensures secure communication between browser and authentication servers", duration: "Session" },
            ]}
          />

          <CookieCategory
            type="Analytics (Cookieless)"
            color="amber"
            canOptOut={true}
            description="Vercel Analytics is cookieless — it does not set any cookies or store personal identifiers. It collects only anonymised, aggregated performance data."
            cookies={[
              { name: "(none)", provider: "Vercel Analytics", purpose: "Anonymous page view counts, country-level traffic data, performance metrics", duration: "Not stored on device" },
            ]}
          />
        </div>
      </Section>

      <Section title="3. Cookies We Do NOT Use">
        <p>We do <strong>not</strong> use:</p>
        <ul>
          <li>❌ Advertising or marketing cookies</li>
          <li>❌ Third-party tracking pixels (Facebook Pixel, Google Ads, etc.)</li>
          <li>❌ Behavioural profiling cookies</li>
          <li>❌ Social media tracking cookies</li>
          <li>❌ Cross-site tracking technologies</li>
        </ul>
      </Section>

      <Section title="4. Managing Cookies">
        <p>
          <strong>Strictly necessary cookies</strong> cannot be disabled without preventing you from logging in and
          using the authenticated features of this Service.
        </p>
        <p>
          You can control and manage cookies through your browser settings. Most browsers allow you to:
        </p>
        <ul>
          <li>View cookies currently stored on your device</li>
          <li>Block or delete specific cookies</li>
          <li>Block all cookies from specific websites</li>
          <li>Block all third-party cookies</li>
        </ul>
        <p>Browser-specific guides:</p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-4">Safari</a></li>
        </ul>
      </Section>

      <Section title="5. Local Storage">
        <p>
          In addition to cookies, this Service may use browser <strong>local storage</strong> or{" "}
          <strong>session storage</strong> to temporarily store UI state (e.g., form progress, theme preference).
          This data is stored only on your device, is not transmitted to our servers, and is cleared when you
          close your browser tab or clear your browser data.
        </p>
      </Section>

      <Section title="6. Changes to This Policy">
        <p>
          We may update this Cookie Policy from time to time. Changes will be posted with a revised "Last Updated"
          date. Continued use of the Service after changes constitutes acceptance.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          For any questions about our use of cookies:
        </p>
        <ul>
          <li><strong>Email:</strong> privacy@akubrecah.com</li>
          <li><strong>Website:</strong> akubrecah.com</li>
        </ul>
        <p>
          See also our <a href="/legal/privacy" className="text-amber-400 underline underline-offset-4">Privacy Policy</a> for full information on how we handle your data.
        </p>
      </Section>
    </div>
  )
}

function CookieCategory({
  type, color, canOptOut, description, cookies
}: {
  type: string
  color: "green" | "amber" | "red"
  canOptOut: boolean
  description: string
  cookies: { name: string; provider: string; purpose: string; duration: string }[]
}) {
  const colorMap = {
    green: "border-green-500/20 bg-green-500/5",
    amber: "border-amber-400/20 bg-amber-400/5",
    red: "border-red-500/20 bg-red-500/5",
  }
  const badgeMap = {
    green: "bg-green-500/20 text-green-400",
    amber: "bg-amber-400/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-3">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeMap[color]}`}>
          {type}
        </span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
          {canOptOut ? "Can opt out" : "Cannot opt out"}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">{description}</p>
      <div className="space-y-2">
        {cookies.map((c, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 text-[10px] border-t border-white/5 pt-2">
            <span className="font-bold text-foreground font-mono">{c.name}</span>
            <span className="text-muted-foreground">{c.provider}</span>
            <span className="text-muted-foreground col-span-1">{c.purpose}</span>
            <span className="text-muted-foreground text-right">{c.duration}</span>
          </div>
        ))}
      </div>
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
