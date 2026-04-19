import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Shared slugify used by route, sitemap, share buttons, and spotlight cards.
 * Must remain a single source of truth — changing this invalidates existing URLs.
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export type Article = {
  id: string
  title: string
  url: string | null
  source_name: string
  source_url: string | null
  category: string
  tags: string[]
  summary: string | null
  priority: string | null
  lead: string | null
  northstar_note: string | null
  social_copy_x: string | null
  social_copy_linkedin: string | null
  social_copy_bluesky: string | null
  views: number
  posted_x: boolean
  posted_linkedin: boolean
  posted_bluesky: boolean
  newsletter_included: boolean
  published_at: string
  created_at: string
}

export type KeyDate = {
  id: string
  title: string
  deadline_date: string
  description: string | null
  category: string | null
  created_at: string
}

export type Spotlight = {
  id: string
  person_name: string
  headline: string | null
  job_title: string
  firm: string
  specialism: string | null
  paragraph: string
  source_evidence: string | null
  news_hook_url: string | null
  news_hook_label: string | null
  linkedin_url: string | null
  issue_date: string
  published: boolean
  created_at: string
}

/**
 * Lead stories: articles with priority 'high' or 'medium',
 * ordered by published_at DESC (most recent first).
 * Low priority articles only appear in the Wire section.
 */
export async function getLeadStories() {
  const supabase = createClient()
  const { data: leads, error } = await supabase
    .from("articles")
    .select("*")
    .in("priority", ["high", "medium"])
    .order("published_at", { ascending: false })
    .limit(6)

  if (!leads || error) return []
  return leads.map(l => ({ ...l, cluster: [] }))
}

/**
 * Wire articles: all articles ordered by published_at DESC.
 */
export async function getWireArticles() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(30)
  return data || []
}

// Hardcoded HMRC deadlines until we populate the key_dates table
const HMRC_DEADLINES: KeyDate[] = [
  { id: "1", title: "CGT 60-day report", deadline_date: "2026-03-15", description: null, category: "capital-taxes", created_at: "" },
  { id: "2", title: "Corporation Tax payment", deadline_date: "2026-04-01", description: null, category: "business-tax", created_at: "" },
  { id: "3", title: "MTD for Income Tax (ITSA) starts", deadline_date: "2026-04-06", description: null, category: "personal-tax", created_at: "" },
  { id: "4", title: "Quarterly PAYE settlement", deadline_date: "2026-04-22", description: null, category: "employment-tax", created_at: "" },
  { id: "5", title: "VAT Return Q1 deadline", deadline_date: "2026-05-07", description: null, category: "vat", created_at: "" },
  { id: "6", title: "Company accounts filing", deadline_date: "2026-06-30", description: null, category: "business-tax", created_at: "" },
  { id: "7", title: "P11D filing deadline", deadline_date: "2026-07-06", description: null, category: "employment-tax", created_at: "" },
  { id: "8", title: "SA Payment on Account", deadline_date: "2026-07-31", description: null, category: "personal-tax", created_at: "" },
  { id: "9", title: "Self Assessment filing deadline", deadline_date: "2027-01-31", description: null, category: "personal-tax", created_at: "" },
]

export async function getKeyDates() {
  // Filter out past dates and sort by deadline
  const today = new Date().toISOString().split("T")[0]
  return HMRC_DEADLINES
    .filter(d => d.deadline_date >= today)
    .sort((a, b) => a.deadline_date.localeCompare(b.deadline_date))
}

export async function getTrendingArticles() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("views", { ascending: false })
    .limit(5)
  return data || []
}

export async function getCategoryCounts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("articles")
    .select("category")

  if (!data) return {}

  const counts: Record<string, number> = {}
  data.forEach((row) => {
    if (row.category) {
      counts[row.category] = (counts[row.category] || 0) + 1
    }
  })
  return counts
}

/**
 * Get articles filtered by category, ordered by published_at DESC.
 */
export async function getArticlesByCategory(category: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("category", category)
    .order("published_at", { ascending: false })
  return data || []
}

/**
 * Get articles filtered by tag (contained in the tags text array).
 */
export async function getArticlesByTag(tag: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("articles")
    .select("*")
    .contains("tags", [tag])
    .order("published_at", { ascending: false })
  return data || []
}

/**
 * Governance Corner: 3 most recent articles from 'HMRC & Practice' category
 * that have 'Compliance' in their tags array.
 */
export async function getGovernanceArticles() {
  const supabase = createClient()
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("category", "hmrc-practice")
    .contains("tags", ["Compliance"])
    .order("published_at", { ascending: false })
    .limit(3)
  return data || []
}

/**
 * In the Spotlight: Featured professionals, published entries only.
 */
export async function getSpotlights(limit = 5) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("spotlight")
    .select("*")
    .eq("published", true)
    .order("issue_date", { ascending: false })
    .limit(limit)
  return data || []
}

/**
 * All spotlight entries for archive page, grouped by issue_date.
 * Returns only published entries for public archive display.
 */
export async function getAllSpotlights() {
  const supabase = createClient()
  const { data } = await supabase
    .from("spotlight")
    .select("*")
    .eq("published", true)
    .order("issue_date", { ascending: false })
  return data || []
}

/**
 * ALL spotlight entries regardless of published status.
 * Used by sitemap and by the [slug] route so that every profile ever featured
 * retains a permanent, indexable URL even after rotation.
 */
export async function getEverySpotlight(): Promise<Spotlight[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("spotlight")
    .select("*")
    .order("issue_date", { ascending: false })
  return data || []
}

/**
 * Look up a single spotlight by slugified person_name.
 * Matches regardless of published status — fetches every row and compares
 * slugs in memory so the slug algorithm always matches the route.
 * Returns null if no row matches.
 */
export async function getSpotlightBySlug(slug: string): Promise<Spotlight | null> {
  const all = await getEverySpotlight()
  return all.find(s => slugifyName(s.person_name) === slug) || null
}

/**
 * Get articles with optional category and tag filters.
 * All filtering done server-side in Supabase.
 */
export async function getFilteredArticles(options: {
  category?: string
  tags?: string[]
  search?: string
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })

  // Category filter
  if (options.category && options.category !== "All") {
    query = query.eq("category", options.category)
  }

  // Tag filter (articles must contain ALL specified tags)
  if (options.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags)
  }

  // Search filter (title contains search term)
  if (options.search && options.search.trim()) {
    query = query.ilike("title", `%${options.search.trim()}%`)
  }

  // Limit
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data } = await query
  return data || []
}
