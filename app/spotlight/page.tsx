import { getAllSpotlights, Spotlight, slugifyName } from "@/lib/queries"
import { Masthead } from "@/components/masthead"
import { DeadlineTicker } from "@/components/deadline-ticker"
import { getKeyDates } from "@/lib/queries"
import Link from "next/link"
import { ShareThisWeekButton } from "@/components/spotlight-share"
import { SpotlightCard } from "@/components/spotlight-card"
import { EmailCapture } from "@/components/sidebar"
import { ScrollToHash } from "@/components/scroll-to-hash"

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const spotlights = await getAllSpotlights()
  const latestWeek = spotlights.slice(0, 5)

  if (latestWeek.length > 0) {
    const names = latestWeek.map(s => s.person_name)
    const description = `This week's into.tax In the Spotlight features ${names.join(", ")}.`

    return {
      title: "In the Spotlight | into.tax",
      description,
      openGraph: {
        title: "In the Spotlight | into.tax",
        description,
        url: "https://into.tax/spotlight",
        siteName: "into.tax",
        images: [
          {
            url: "https://into.tax/og-image.png",
            width: 1200,
            height: 630,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "In the Spotlight | into.tax",
        description,
        images: ["https://into.tax/og-image.png"],
      },
    }
  }

  return {
    title: "In the Spotlight | into.tax",
    description: "Five UK tax professionals doing work that matters.",
  }
}

function groupByIssueDate(spotlights: Spotlight[]): Record<string, Spotlight[]> {
  const grouped: Record<string, Spotlight[]> = {}
  for (const s of spotlights) {
    if (!grouped[s.issue_date]) {
      grouped[s.issue_date] = []
    }
    grouped[s.issue_date].push(s)
  }
  return grouped
}

function formatWeekOf(dateStr: string) {
  const date = new Date(dateStr)
  const day = date.getUTCDate()
  const month = date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })
  const year = date.getUTCFullYear()
  return `Week of ${day} ${month} ${year}`
}

export default async function SpotlightArchivePage() {
  const [spotlights, keyDates] = await Promise.all([
    getAllSpotlights(),
    getKeyDates(),
  ])

  const grouped = groupByIssueDate(spotlights)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // Get this week's spotlights for the share button
  const thisWeekSpotlights = sortedDates.length > 0 ? grouped[sortedDates[0]] : []

  return (
    <div className="min-h-screen bg-[#FDFCFA]">
      <ScrollToHash />
      <Masthead />
      <DeadlineTicker dates={keyDates} />

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="text-[36px] md:text-[42px] font-serif font-bold text-[#1C1412] tracking-tight">
            In the Spotlight
          </h1>
          <p className="text-[17px] font-sans text-[#6B5B4F] mt-3 max-w-xl mx-auto">
            Five UK tax professionals doing work that matters.
          </p>
          <div className="w-24 h-[3px] bg-[#A0522D] mx-auto mt-6" />

          {/* Share this week's spotlight button */}
          {thisWeekSpotlights.length > 0 && (
            <div className="mt-8">
              <ShareThisWeekButton spotlights={thisWeekSpotlights} />
            </div>
          )}
        </header>

        {sortedDates.length === 0 ? (
          <p className="text-muted-foreground text-center py-16 font-sans">
            No spotlight entries yet. Check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-16">
            {sortedDates.map((date) => (
              <section key={date}>
                <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#A0522D] mb-8 pb-3 border-b border-[#E8DFD6]">
                  {formatWeekOf(date)}
                </h2>

                <div className="flex flex-col gap-8">
                  {grouped[date].map((s) => (
                    <SpotlightCard
                      key={s.id}
                      spotlight={s}
                      slug={slugifyName(s.person_name)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="mt-16 max-w-md mx-auto">
          <EmailCapture />
        </div>

        <div className="mt-12 pt-8 border-t border-[#E8DFD6] text-center">
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
