import Link from "next/link"

export const metadata = {
  title: "Cookie Policy — into.tax",
  description: "Cookie policy for into.tax - UK Tax Intelligence",
}

export default function CookiesPage() {
  const lastUpdated = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-serif font-bold text-foreground hover:text-accent-warm transition-colors">
            into.tax
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
          Cookie Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {lastUpdated}
        </p>

        <div className="prose prose-sm md:prose-base max-w-none">
          <p className="text-foreground leading-relaxed mb-6">
            into.tax is built to respect your privacy. We use only the cookies strictly necessary to keep the site working. We do not track you, profile you, or share your data with advertisers.
          </p>

          <p className="text-foreground leading-relaxed mb-8">
            We do not use advertising, analytics, or tracking cookies. Our site analytics are cookieless and do not store any information on your device.
          </p>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            What are cookies?
          </h2>
          <p className="text-foreground leading-relaxed mb-8">
            Cookies are small text files stored on your device when you visit a website. They allow the site to remember information about your visit, such as whether you have seen a notice or are logged in to a service.
          </p>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            How we use cookies
          </h2>
          <p className="text-foreground leading-relaxed mb-4">
            We use only essential cookies — the minimum required for the site to function securely. These cookies do not track your behaviour, collect personal data, or leave your device for any third-party system.
          </p>
          <p className="text-foreground leading-relaxed mb-8">
            We use cookieless analytics to understand how visitors use into.tax. Our analytics solution does not set cookies, does not fingerprint your device, and does not collect personally identifiable information. It is not subject to cookie consent requirements.
          </p>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            Cookies we set
          </h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border border-border rounded-md">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left px-4 py-3 font-medium text-foreground border-b border-border">Cookie</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground border-b border-border">Provider</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground border-b border-border">Purpose</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground border-b border-border">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground border-b border-border">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground border-b border-border">cookie_notice</td>
                  <td className="px-4 py-3 text-muted-foreground border-b border-border">into.tax</td>
                  <td className="px-4 py-3 text-muted-foreground border-b border-border">Remembers that you have seen this notice so it does not reappear on every visit</td>
                  <td className="px-4 py-3 text-muted-foreground border-b border-border">12 months</td>
                  <td className="px-4 py-3 text-muted-foreground border-b border-border">Essential</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            Third-party cookies
          </h2>
          <p className="text-foreground leading-relaxed mb-8">
            We do not permit any third-party advertising, social media, or tracking cookies on this site. No data collected through your visit to into.tax is shared with advertisers or data brokers.
          </p>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            Managing cookies
          </h2>
          <p className="text-foreground leading-relaxed mb-8">
            Because we use only essential cookies, there is nothing to opt in or out of. If you wish to clear or block cookies entirely, you can do so through your browser settings. Instructions are available at{" "}
            <a href="https://aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-accent-warm hover:underline">
              aboutcookies.org
            </a>
            . Note that blocking essential cookies may affect how the site works.
          </p>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            Changes to this policy
          </h2>
          <p className="text-foreground leading-relaxed mb-8">
            If we ever introduce optional cookies in future, we will update this policy and seek your consent before setting them. The date at the top of this page reflects the most recent version.
          </p>

          <h2 className="text-xl font-serif font-bold text-foreground mt-10 mb-4">
            Questions?
          </h2>
          <p className="text-foreground leading-relaxed mb-4">
            If you have any questions about cookies on into.tax, please get in touch.
          </p>
          <p className="mb-12">
            <a href="mailto:hello@into.tax" className="text-accent-warm hover:underline font-medium">
              hello@into.tax
            </a>
          </p>
        </div>

        {/* Back link */}
        <div className="pt-8 border-t border-border">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to into.tax
          </Link>
        </div>
      </article>
    </main>
  )
}
