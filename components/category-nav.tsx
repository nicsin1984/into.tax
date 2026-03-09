"use client"

import { Search } from "lucide-react"

// Map display names to database values
const CATEGORIES = [
  { label: "All", dbKey: "All" },
  { label: "Personal Tax", dbKey: "personal-tax" },
  { label: "Business Tax", dbKey: "business-tax" },
  { label: "Employment Tax", dbKey: "employment-tax" },
  { label: "VAT & Indirect", dbKey: "vat" },
  { label: "Capital Taxes", dbKey: "capital-taxes" },
  { label: "HMRC & Practice", dbKey: "hmrc-practice" },
]

const TAGS = [
  "MTD",
  "Budget",
  "Finance Bill",
  "Case Law",
  "HMRC Guidance",
  "International",
  "Consultation",
  "Software & Tech",
  "Compliance",
]

export function CategoryNav({
  activeCategory,
  activeTags,
  onCategoryChange,
  onTagToggle,
  categoryCounts,
  onSearchClick,
}: {
  activeCategory: string
  activeTags: string[]
  onCategoryChange: (cat: string) => void
  onTagToggle: (tag: string) => void
  categoryCounts: Record<string, number>
  onSearchClick?: () => void
}) {
  const totalArticles = Object.values(categoryCounts).reduce((sum, n) => sum + n, 0)

  return (
    <nav className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Category tabs */}
        <div className="flex items-center gap-1 md:gap-2 py-2 overflow-x-auto scrollbar-hide" role="tablist">
          {/* Search button */}
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="px-3 py-3 md:py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors min-h-[48px] md:min-h-0 flex items-center gap-1.5"
              aria-label="Search articles"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs font-mono hidden md:inline">/</span>
            </button>
          )}
          {CATEGORIES.map((cat) => {
            const count = cat.dbKey === "All" ? totalArticles : (categoryCounts[cat.dbKey] ?? 0)
            return (
              <button
                key={cat.dbKey}
                role="tab"
                aria-selected={activeCategory === cat.dbKey}
                onClick={() => onCategoryChange(cat.dbKey)}
                className={`px-4 md:px-5 py-3 md:py-2 text-xs font-mono tracking-wide rounded-md whitespace-nowrap transition-colors min-h-[48px] md:min-h-0 ${
                  activeCategory === cat.dbKey
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat.label}
                <sup className={`ml-2 text-[9px] relative -top-1 ${activeCategory === cat.dbKey ? "opacity-60" : "opacity-40"}`}>
                  {count}
                </sup>
              </button>
            )
          })}
        </div>
        {/* Tag pills */}
        <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-2 md:px-2.5 md:py-1 text-[11px] font-mono rounded-full border transition-colors whitespace-nowrap min-h-[48px] md:min-h-0 ${
                activeTags.includes(tag)
                  ? "bg-accent-warm text-accent-warm-foreground border-accent-warm"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
