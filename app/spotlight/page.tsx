import { getAllSpotlights, Spotlight } from "@/lib/queries"
import { Masthead } from "@/components/masthead"
import { DeadlineTicker } from "@/components/deadline-ticker"
import { getKeyDates } from "@/lib/queries"
import Link from "next/link"
import { Linkedin } from "lucide-react"
import { SpotlightShareButtons, ShareThisWeekButton } from "@/components/spotlight-share"
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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
                  {grouped[date].map((s) => {
                    const slug = slugify(s.person_name)
                    return (
                      <article
                        key={s.id}
                        id={slug}
                        className="relative bg-[#FFFDF9] rounded-lg p-8 md:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden scroll-mt-32"
                      >
                        {/* Decorative quotation mark */}
                        <div 
                          className="absolute top-4 right-6 text-[120px] font-serif text-[#F5E6D8] leading-none pointer-events-none select-none"
                          aria-hidden="true"
                        >
                          "
                        </div>
                        
                        <div className="relative">
                          {/* Name */}
                          <h3 className="text-[24px] font-serif font-bold text-[#1C1412] leading-tight">
                            {s.person_name}
                          </h3>
                          
                          {/* Headline as pull quote */}
                          {s.headline && (
                            <p className="text-[16px] italic text-[#A0522D] mt-2 leading-snug">
                              {s.headline}
                            </p>
                          )}
                          
                          {/* Metadata bar */}
                          <p className="text-[11px] font-mono text-[#8B7B6B] mt-4 flex flex-wrap items-center gap-1.5">
                            <span>{s.job_title}</span>
                            {s.firm && (
                              <>
                                <span className="text-[#C4B5A5]">·</span>
                                <span>{s.firm}</span>
                              </>
                            )}
                            {s.specialism && (
                              <>
                                <span className="text-[#C4B5A5]">·</span>
                                <span>{s.specialism}</span>
                              </>
                            )}
                          </p>
                          
                          {/* Profile section */}
                          <div className="mt-6">
                            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#8B7B6B] mb-2">
                              Profile
                            </h4>
                            <p className="text-[14px] font-sans text-[#3D3530] leading-[1.7]">
                              {s.paragraph}
                            </p>
                          </div>
                          
                          {/* Source evidence - styled as highlighted callout */}
                          {s.source_evidence && (
                            <div className="mt-6 bg-[#F5F0EA] border-l-4 border-[#A0522D] rounded-r-md p-4">
                              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#6B5B4F] mb-2">
                                Why they're in the spotlight
                              </h4>
                              <p className="text-[13px] font-sans italic text-[#5A4A3A] leading-relaxed">
                                {s.source_evidence}
                              </p>
                            </div>
                          )}
                          
                          {/* LinkedIn profile link */}
                          {s.linkedin_url && (
                            <a
                              href={s.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-6 text-[12px] font-mono text-[#0A66C2] hover:text-[#004182] transition-colors"
                            >
                              <Linkedin className="w-4 h-4" />
                              <span>View on LinkedIn</span>
                            </a>
                          )}
                          
                          {/* Share buttons */}
                          <SpotlightShareButtons spotlight={s} slug={slug} />
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

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
