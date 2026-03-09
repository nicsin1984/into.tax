import { DeadlineTicker } from "@/components/deadline-ticker"
import { Masthead } from "@/components/masthead"
import { HomepageContent } from "@/components/homepage-content"
import {
  getLeadStories,
  getWireArticles,
  getKeyDates,
  getTrendingArticles,
  getCategoryCounts,
  getGovernanceArticles,
  getSpotlights,
} from "@/lib/queries"

export const revalidate = 0 // No cache - always fetch fresh data
export const dynamic = 'force-dynamic' // Bypass all caching

export default async function HomePage() {
  const [leadStories, wireArticles, keyDates, trending, categoryCounts, governanceArticles, spotlights] =
    await Promise.all([
      getLeadStories(),
      getWireArticles(),
      getKeyDates(),
      getTrendingArticles(),
      getCategoryCounts(),
      getGovernanceArticles(),
      getSpotlights(),
    ])

  return (
    <div className="min-h-screen bg-background">
      <DeadlineTicker dates={keyDates} />
      <Masthead />
      <HomepageContent
        leadStories={leadStories}
        wireArticles={wireArticles}
        trending={trending}
        keyDates={keyDates}
        categoryCounts={categoryCounts}
        governanceArticles={governanceArticles}
        spotlights={spotlights}
      />
      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <p>into.tax &middot; UK Tax Intelligence &middot; {new Date().getFullYear()}</p>
          <p>Aggregated from public sources. Not tax advice.</p>
        </div>
      </footer>
    </div>
  )
}
