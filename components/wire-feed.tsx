"use client"

import type { Article } from "@/lib/queries"

// Month abbreviations for date formatting
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const day = date.getUTCDate()
  const month = MONTHS[date.getUTCMonth()]
  return `${day} ${month}`
}

interface WireFeedProps {
  articles: Article[]
  selectedIndex?: number
  onSelect?: (index: number) => void
  articleRefs?: React.MutableRefObject<(HTMLElement | null)[]>
  startIndex?: number
}

export function WireFeed(props: WireFeedProps) {
  const { articles, selectedIndex = -1, onSelect, articleRefs, startIndex = 0 } = props

  if (articles.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground font-mono text-sm">
        No wire stories
      </div>
    )
  }

  const articleElements = articles.map((article, idx) => {
    const isSelected = selectedIndex === idx
    const dateText = formatDate(article.published_at || article.created_at)
    const linkUrl = article.source_url || article.url || "#"
    const hasLink = Boolean(article.source_url || article.url)
    const isLast = idx === articles.length - 1

    return (
      <div
        key={article.id}
        ref={(el) => {
          if (articleRefs) {
            articleRefs.current[startIndex + idx] = el
          }
        }}
        onClick={() => onSelect?.(idx)}
        className={`py-3 md:py-2 group cursor-pointer ${isLast ? "" : "border-b border-border/50"} ${isSelected ? "bg-accent/50 -mx-2 px-2 rounded" : ""}`}
      >
        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[50px_100px_100px_1fr] gap-2 md:gap-3 items-baseline">
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums text-left md:text-right">
            {dateText}
          </span>
          <div className="flex items-center gap-2 md:contents">
            <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[80px] md:max-w-none">
              {article.source_name}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded whitespace-nowrap">
              {article.category}
            </span>
          </div>
          <div className="col-span-2 md:col-span-1">
            {hasLink ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] md:text-sm text-foreground hover:text-accent-warm transition-colors leading-snug"
              >
                {article.title}
              </a>
            ) : (
              <span className="text-[13px] md:text-sm text-foreground leading-snug">
                {article.title}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  })

  return (
    <section className="mt-8">
      <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-border">
        Wire
      </h2>
      <div className="flex flex-col">
        {articleElements}
      </div>
    </section>
  )
}
