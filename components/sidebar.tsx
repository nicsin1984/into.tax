"use client"

import { useState } from "react"
import type { Article, KeyDate, Spotlight } from "@/lib/queries"
import Link from "next/link"
import { TrendingUp, Calendar, Layers, Shield, Keyboard } from "lucide-react"

function daysUntil(dateStr: string) {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "yahoo.com",
  "yahoo.co.uk",
  "icloud.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "mail.com",
  "live.com",
  "live.co.uk",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
  "talktalk.net",
])

function EmailCapture() {
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    
    const trimmedEmail = email.trim().toLowerCase()
    
    // Validate email format
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setStatus({ success: false, message: "Please enter a valid email address." })
      return
    }
    
    // Check for blocked domains client-side
    const domain = trimmedEmail.split("@")[1]
    if (BLOCKED_DOMAINS.has(domain)) {
      setStatus({ 
        success: false, 
        message: "Please use your practice email — into.tax is for accountancy professionals." 
      })
      return
    }
    
    setPending(true)

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      
      // Check if response is JSON
      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text()
        console.log("[v0] Non-JSON response:", text.substring(0, 200))
        setStatus({ success: false, message: "Server error. Please try again." })
        return
      }
      
      const data = await res.json()
      console.log("[v0] Subscribe response:", data)
      setStatus(data)
    } catch (err) {
      console.log("[v0] Subscribe error:", err)
      setStatus({ success: false, message: "Connection error. Please try again." })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="bg-[#1C1412] rounded-lg p-4 md:p-5 w-full">
      <h3 className="text-xs font-mono uppercase tracking-widest text-[#F5F0E8] font-semibold mb-1.5">
        Weekly Digest
      </h3>
      <p className="text-[15px] font-serif italic text-[#F5F0E8]/80 mb-1">
        The week in UK tax.
      </p>
      <p className="text-[11px] text-[#F5F0E8]/50 mb-4 leading-relaxed">
        Curated from 120+ sources. Every Friday morning.
      </p>

      {status?.success ? (
        <p className="text-sm font-serif text-[#C8702A]">
          {status.message}
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@practice.co.uk"
              required
              aria-label="Business email address"
              className="flex-1 text-xs font-mono bg-[#F5F0E8]/10 border border-[#F5F0E8]/20 rounded-md px-3 py-3 md:py-2.5 text-[#F5F0E8] placeholder:text-[#F5F0E8]/30 focus:outline-none focus:ring-1 focus:ring-[#C8702A]/60 min-h-[48px] md:min-h-0"
            />
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-3 md:py-2.5 bg-[#C8702A] text-[#F5F0E8] text-xs font-mono font-semibold uppercase tracking-wider rounded-md hover:bg-[#C8702A]/90 transition-colors disabled:opacity-50 min-h-[48px] md:min-h-0"
            >
              {pending ? "..." : "Go"}
            </button>
          </div>
          {status && !status.success && (
            <p className="text-xs text-[#E85D4A] mt-2 leading-relaxed">
              {status.message}
            </p>
          )}
          <p className="text-[10px] text-[#F5F0E8]/35 mt-2.5 font-mono">
            Firm email only &middot; No spam
          </p>
        </form>
      )}
    </div>
  )
}

function TrendingStories({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-accent-warm" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
            Trending
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">No trending articles</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-accent-warm" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
          Trending
        </h3>
      </div>
      <div className="flex flex-col gap-0">
        {articles.map((a, i) => {
          const articleUrl = a.source_url || a.url || "#"
          return (
            <a
              key={a.id}
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start gap-2.5 py-3 md:py-2.5 group min-h-[48px] ${
                i < articles.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <span className="text-lg font-serif font-bold text-muted-foreground/40 tabular-nums leading-none mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug line-clamp-2 group-hover:text-accent-warm transition-colors">
                  {a.title}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  {a.source_name}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function KeyDatesPanel({ dates }: { dates: KeyDate[] }) {
  // Filter out past dates
  const futureDates = dates.filter(d => daysUntil(d.deadline_date) > 0)
  
  if (futureDates.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-accent-warm" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
            Key Dates
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-accent-warm" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
          Key Dates
        </h3>
      </div>
      <div className="flex flex-col gap-0">
        {futureDates.slice(0, 5).map((d, i) => {
          const days = daysUntil(d.deadline_date)
          return (
            <div
              key={d.id}
              className={`flex items-start gap-3 py-2.5 ${
                i < Math.min(futureDates.length, 5) - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div className="shrink-0 w-10 text-center">
                <span
                  className={`text-sm font-mono font-bold ${
                    days <= 30
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {days}d
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{d.title}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {new Date(d.deadline_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionIndex({
  counts,
  activeCategory,
  onCategoryChange,
}: {
  counts: Record<string, number>
  activeCategory: string
  onCategoryChange: (cat: string) => void
}) {
  const sections = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-accent-warm" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
          Sections
        </h3>
      </div>
      <div className="flex flex-col gap-1">
        {sections.map(([section, count]) => {
          const isActive = activeCategory === section
          return (
            <button
              key={section}
              onClick={() => onCategoryChange(isActive ? "All" : section)}
              className="flex items-center justify-between py-3 md:py-1.5 text-sm text-left transition-colors group min-h-[48px] md:min-h-0 w-full"
            >
              <span
                className={
                  isActive
                    ? "text-accent-warm font-medium"
                    : "text-foreground group-hover:text-accent-warm"
                }
              >
                {section}
              </span>
              <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "Yesterday"
  return `${diffDays}d ago`
}

function GovernanceCorner({ articles }: { articles: Article[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-accent-warm" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
          Governance Corner
        </h3>
      </div>
      <div className="flex flex-col gap-0">
        {articles.map((a, i) => (
          <div
            key={a.id}
            className={`py-2.5 ${
              i < articles.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            <p className="text-[10px] font-mono text-muted-foreground mb-1">
              {formatTimeAgo(a.created_at)} &middot; {a.source_name}
            </p>
            <a
              href={a.source_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground leading-snug line-clamp-2 hover:text-accent-warm transition-colors"
            >
              {a.title}
            </a>
          </div>
        ))}
      </div>
      
    </div>
  )
}

function SpotlightPanel({ spotlights }: { spotlights: Spotlight[] }) {
  if (spotlights.length === 0) return null
  
  return (
    <div className="bg-[#F5F0EA] rounded-lg p-4 border-l-4 border-[#A0522D]">
      <Link href="/spotlight" className="block">
        <h3 className="text-[9px] font-mono uppercase tracking-widest text-[#1C1412] font-semibold mb-3 hover:text-[#A0522D] transition-colors">
          In the Spotlight
        </h3>
      </Link>
      <div className="flex flex-col gap-2.5">
        {spotlights.map((s, i) => (
          <div
            key={s.id}
            className={`${i < spotlights.length - 1 ? "pb-2.5 border-b border-[#A0522D]/20" : ""}`}
          >
            <Link href="/spotlight" className="block">
              <p className="text-[14px] font-serif font-bold text-[#1C1412] hover:text-[#A0522D] transition-colors">
                {s.person_name}
              </p>
            </Link>
            <p className="text-[11px] font-sans text-[#6B5B4F] mt-0.5">
              {s.job_title}, {s.firm}
            </p>
          </div>
        ))}
      </div>
      <Link
        href="/spotlight"
        className="inline-block mt-3 text-xs font-mono text-[#A0522D] hover:text-[#8B4513] transition-colors"
      >
        See all past spotlights &rarr;
      </Link>
    </div>
  )
}

function KeyboardShortcuts() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="h-4 w-4 text-accent-warm" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
          Shortcuts
        </h3>
      </div>
      <div className="flex flex-col gap-1.5 text-xs font-mono text-muted-foreground">
        <div className="flex justify-between">
          <span>Next story</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">j</kbd>
        </div>
        <div className="flex justify-between">
          <span>Previous story</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">k</kbd>
        </div>
        <div className="flex justify-between">
          <span>Open link</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">o</kbd>
        </div>
        <div className="flex justify-between">
          <span>Search</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">/</kbd>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({
  trending,
  keyDates,
  categoryCounts,
  governanceArticles,
  spotlights,
  activeCategory,
  onCategoryChange,
}: {
  trending: Article[]
  keyDates: KeyDate[]
  categoryCounts: Record<string, number>
  governanceArticles: Article[]
  spotlights: Spotlight[]
  activeCategory: string
  onCategoryChange: (cat: string) => void
}) {
  return (
    <aside className="flex flex-col gap-6">
      <EmailCapture />
      <SpotlightPanel spotlights={spotlights} />
      <TrendingStories articles={trending} />
      <div className="border-t border-border" />
      <KeyDatesPanel dates={keyDates} />
      <div className="border-t border-border" />
      <SectionIndex
        counts={categoryCounts}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />
      <div className="border-t border-border" />
      <GovernanceCorner articles={governanceArticles} />
      <div className="border-t border-border" />
      <KeyboardShortcuts />
    </aside>
  )
}
