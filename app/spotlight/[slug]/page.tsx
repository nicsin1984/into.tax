import { notFound } from "next/navigation"
import Link from "next/link"
import { Masthead } from "@/components/masthead"
import { DeadlineTicker } from "@/components/deadline-ticker"
import { SpotlightCard } from "@/components/spotlight-card"
import { EmailCapture } from "@/components/sidebar"
import { getSpotlightBySlug, getKeyDates, slugifyName } from "@/lib/queries"

export const revalidate = 0
export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: RouteParams) {
  const { slug } = await params
  const spotlight = await getSpotlightBySlug(slug)

  if (!spotlight) {
    return {
      title: "Spotlight not found | into.tax",
    }
  }

  const title = `${spotlight.person_name} \u00B7 into.tax Spotlight`
  const description = spotlight.headline
    || `${spotlight.person_name}, ${spotlight.job_title}${spotlight.firm ? ` at ${spotlight.firm}` : ''}.`
  const canonical = `https://into.tax/spotlight/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "into.tax",
      type: "profile",
      images: [
        {
          url: "https://into.tax/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://into.tax/og-image.png"],
    },
  }
}

function formatIssueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getUTCDate()
  const month = date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}

export default async function SpotlightProfilePage({ params }: RouteParams) {
  const { slug } = await params
  const [spotlight, keyDates] = await Promise.all([
    getSpotlightBySlug(slug),
    getKeyDates(),
  ])

  if (!spotlight) {
    notFound()
  }

  // Build schema.org/Person JSON-LD
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: spotlight.person_name,
    jobTitle: spotlight.job_title,
    worksFor: spotlight.firm
      ? { "@type": "Organization", name: spotlight.firm }
      : undefined,
    knowsAbout: spotlight.specialism || undefined,
    description: spotlight.paragraph,
    url: `https://into.tax/spotlight/${slug}`,
    sameAs: spotlight.linkedin_url ? [spotlight.linkedin_url] : undefined,
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA]">
      <Masthead />
      <DeadlineTicker dates={keyDates} />

      {/* schema.org/Person JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Breadcrumb back link */}
        <div className="mb-8">
          <Link
            href="/spotlight"
            className="text-[12px] font-mono text-[#8B7B6B] hover:text-[#A0522D] transition-colors"
          >
            &larr; Back to all Spotlights
          </Link>
        </div>

        {/* Page Header */}
        <header className="mb-10">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#A0522D] mb-3">
            In the Spotlight &middot; {formatIssueDate(spotlight.issue_date)}
          </p>
          <h1 className="text-[32px] md:text-[38px] font-serif font-bold text-[#1C1412] tracking-tight leading-tight">
            {spotlight.person_name}
          </h1>
          <div className="w-24 h-[3px] bg-[#A0522D] mt-6" />
        </header>

        {/* Full card */}
        <SpotlightCard
          spotlight={spotlight}
          slug={slug}
          standalone
        />

        {/* Subscribe CTA — appears after the profile, when the reader is primed */}
        <div className="mt-12 max-w-md mx-auto">
          <EmailCapture />
        </div>

        <div className="mt-16 pt-8 border-t border-[#E8DFD6] text-center">
          <Link
            href="/"
            className="text-[12px] font-mono text-[#8B7B6B] hover:text-[#A0522D] transition-colors"
          >
            &larr; Back to into.tax
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#E8DFD6] py-8 bg-[#FDFCFA]">
        <div className="max-w-4xl mx-auto px-4 text-center text-[11px] font-mono text-[#8B7B6B]">
          into.tax &middot; UK Tax Intelligence &middot; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
