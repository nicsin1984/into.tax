"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import type { Article, KeyDate, Spotlight } from "@/lib/queries"
import { CategoryNav } from "@/components/category-nav"
import { LeadStories } from "@/components/lead-stories"
import { WireFeed } from "@/components/wire-feed"
import { Sidebar, EmailCapture } from "@/components/sidebar"
import { Search, X, CheckCircle, AlertCircle } from "lucide-react"

type LeadStory = Article & { cluster: Article[] }

export function HomepageContent({
  leadStories: initialLeadStories,
  wireArticles: initialWireArticles,
  trending,
  keyDates,
  categoryCounts,
  governanceArticles,
  spotlights,
}: {
  leadStories: LeadStory[]
  wireArticles: Article[]
  trending: Article[]
  keyDates: KeyDate[]
  categoryCounts: Record<string, number>
  governanceArticles: Article[]
  spotlights: Spotlight[]
}) {
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [articles, setArticles] = useState<Article[]>(initialWireArticles)
  const [leadStories, setLeadStories] = useState<LeadStory[]>(initialLeadStories)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [signupBanner, setSignupBanner] = useState<"confirmed" | "invalid" | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const articleRefs = useRef<(HTMLElement | null)[]>([])

  // Check URL for signup status
  useEffect(() => {
    const signup = searchParams.get("signup")
    if (signup === "confirmed" || signup === "invalid") {
      setSignupBanner(signup)
      // Clear the URL parameter without refresh
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams])

  // Fetch filtered articles from API
  const fetchArticles = useCallback(async (category: string, tags: string[], search: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category && category !== "All") params.set("category", category)
      if (tags.length > 0) params.set("tags", tags.join(","))
      if (search) params.set("search", search)
      
      const res = await fetch(`/api/articles?${params.toString()}`)
      const data = await res.json()
      
      // Split into lead stories (high/medium priority) and wire
      const leads = data
        .filter((a: Article) => a.priority === "high" || a.priority === "medium")
        .slice(0, 6)
        .map((a: Article) => ({ ...a, cluster: [] }))
      const wire = data
      
      setLeadStories(leads)
      setArticles(wire)
    } catch (err) {
      console.error("Failed to fetch articles:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch when filters change
  useEffect(() => {
    // Only fetch if we have active filters (not on initial load)
    if (activeCategory !== "All" || activeTags.length > 0 || searchQuery) {
      fetchArticles(activeCategory, activeTags, searchQuery)
    } else {
      // Reset to initial data when all filters cleared
      setArticles(initialWireArticles)
      setLeadStories(initialLeadStories)
    }
  }, [activeCategory, activeTags, searchQuery, fetchArticles, initialWireArticles, initialLeadStories])

  // Category change handler
  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat)
    setSelectedIndex(-1)
  }, [])

  // Tag toggle handler
  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setSelectedIndex(-1)
  }, [])

  // Search handlers
  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery("")
  }, [])

  // Listen for search event from Masthead
  useEffect(() => {
    const handleOpenSearch = () => openSearch()
    window.addEventListener("openSearch", handleOpenSearch)
    return () => window.removeEventListener("openSearch", handleOpenSearch)
  }, [openSearch])

  // Get all visible articles for keyboard navigation
  const allArticles = [...leadStories, ...articles]

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea (except for Escape)
      const isTyping = 
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement

      // Escape closes search
      if (e.key === "Escape" && searchOpen) {
        closeSearch()
        return
      }

      if (isTyping) return

      // "/" opens search
      if (e.key === "/") {
        e.preventDefault()
        openSearch()
        return
      }

      // "j" - next article
      if (e.key === "j") {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, allArticles.length - 1)
          articleRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" })
          return next
        })
        return
      }

      // "k" - previous article
      if (e.key === "k") {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const next = Math.max(prev - 1, 0)
          articleRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" })
          return next
        })
        return
      }

      // "o" - open selected article
      if (e.key === "o" && selectedIndex >= 0) {
        const article = allArticles[selectedIndex]
        const url = article?.source_url || article?.url
        if (url) window.open(url, "_blank")
        return
      }

      // "0-6" - switch category tabs
      const categoryKeys: Record<string, string> = {
        "0": "All",
        "1": "personal-tax",
        "2": "business-tax",
        "3": "employment-tax",
        "4": "vat",
        "5": "capital-taxes",
        "6": "hmrc-practice",
      }
      if (categoryKeys[e.key]) {
        e.preventDefault()
        handleCategoryChange(categoryKeys[e.key])
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen, closeSearch, openSearch, allArticles, selectedIndex, handleCategoryChange])

  return (
    <>
      {/* Signup confirmation banner */}
      {signupBanner && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] rounded-lg shadow-lg border px-4 py-3 flex items-start gap-3 ${
            signupBanner === "confirmed" 
              ? "bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]" 
              : "bg-[#FFF3E0] border-[#FFCC80] text-[#E65100]"
          }`}
        >
          {signupBanner === "confirmed" ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm flex-1">
            {signupBanner === "confirmed" 
              ? "You're in. First digest arrives Friday morning. Any questions — nicky@into.tax"
              : "That confirmation link isn't valid. Please try signing up again."
            }
          </p>
          <button 
            onClick={() => setSignupBanner(null)}
            className="shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-background/95 z-50 flex items-start justify-center pt-[20vh]">
          <div className="w-full max-w-2xl px-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-12 py-4 text-lg border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent-warm"
              />
              <button
                onClick={closeSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center font-mono">
              Press <kbd className="px-1.5 py-0.5 bg-secondary rounded">Esc</kbd> to close
            </p>
            
            {/* Search results preview */}
            {searchQuery && (
              <div className="mt-4 max-h-[50vh] overflow-y-auto">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Searching...</p>
                ) : articles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No articles found</p>
                ) : (
                  <div className="space-y-2">
                    {articles.slice(0, 10).map((article) => (
                      <a
                        key={article.id}
                        href={article.source_url || article.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg hover:bg-accent transition-colors"
                        onClick={closeSearch}
                      >
                        <p className="text-sm font-medium text-foreground">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {article.source_name} · {article.category}
                        </p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <CategoryNav
        activeCategory={activeCategory}
        activeTags={activeTags}
        onCategoryChange={handleCategoryChange}
        onTagToggle={toggleTag}
        categoryCounts={categoryCounts}
        onSearchClick={openSearch}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Mobile-only Weekly Digest at top */}
        <div className="md:hidden mb-6">
          <EmailCapture />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Main column */}
          <main className="flex-1 min-w-0">
            {loading && (
              <div className="text-center py-4 text-muted-foreground font-mono text-sm">
                Loading...
              </div>
            )}
            <LeadStories 
              stories={leadStories} 
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              articleRefs={articleRefs}
            />
            <WireFeed 
              articles={articles} 
              selectedIndex={selectedIndex - leadStories.length}
              onSelect={(i) => setSelectedIndex(i + leadStories.length)}
              articleRefs={articleRefs}
              startIndex={leadStories.length}
            />
          </main>
          {/* Sidebar */}
          <div className="w-full md:w-[280px] shrink-0">
            <Sidebar
              trending={trending}
              keyDates={keyDates}
              categoryCounts={categoryCounts}
              governanceArticles={governanceArticles}
              spotlights={spotlights}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </div>
      </div>
    </>
  )
}
