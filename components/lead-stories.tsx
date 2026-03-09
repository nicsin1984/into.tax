import type { Article } from "@/lib/queries"
import { Eye, ExternalLink } from "lucide-react"

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  // Use UTC to avoid hydration mismatch between server and client timezones
  const day = date.getUTCDate()
  const month = MONTHS[date.getUTCMonth()]
  return `${day} ${month}`
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (priority === "breaking") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-[#A63D2F]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#A63D2F]" />
        Breaking
      </span>
    )
  }
  if (priority === "high") {
    return (
      <span className="inline-flex items-center text-[9px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#A63D2F]" />
      </span>
    )
  }
  return null
}

function SourceDot({ name }: { name: string }) {
  // Deterministic colour from source name
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: `oklch(0.65 0.15 ${hue})` }}
      />
      {name}
    </span>
  )
}

export function LeadStories({
  stories,
  selectedIndex = -1,
  onSelect,
  articleRefs,
}: {
  stories: (Article & { cluster: Article[] })[]
  selectedIndex?: number
  onSelect?: (index: number) => void
  articleRefs?: React.MutableRefObject<(HTMLElement | null)[]>
}) {
  if (stories.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground font-mono text-sm">
        No lead stories found
      </div>
    )
  }

  return (
    <section>
      <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-border">
        Lead Stories
      </h2>
      <div className="flex flex-col gap-0">
        {stories.map((story, idx) => {
          const isSelected = selectedIndex === idx
          return (
          <article
            key={story.id}
            ref={(el) => { if (articleRefs) articleRefs.current[idx] = el }}
            onClick={() => onSelect?.(idx)}
            className={`py-5 cursor-pointer ${
              idx < stories.length - 1 ? "border-b border-border" : ""
            } ${isSelected ? "bg-accent/50 -mx-2 px-2 rounded" : ""}`}
          >
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {formatDate(story.published_at || story.created_at)}
              </span>
              <PriorityBadge priority={story.priority} />
              <SourceDot name={story.source_name} />
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                {story.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground ml-auto">
                <Eye className="h-3 w-3" />
                {(story.views ?? 0).toLocaleString()}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-lg md:text-xl lg:text-2xl font-serif font-bold leading-tight text-foreground mb-2">
              {(story.source_url || story.url) ? (
                <a
                  href={story.source_url || story.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-warm transition-colors"
                >
                  {story.title}
                </a>
              ) : (
                story.title
              )}
            </h3>

            {/* Summary */}
            {story.summary && (
              <p className="text-[13px] md:text-sm leading-relaxed text-muted-foreground mb-3 max-w-2xl">
                {story.summary}
              </p>
            )}

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Cluster / Also covering */}
            {story.cluster.length > 0 && (
              <div className="ml-4 pl-4 border-l-2 border-border">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Also covering
                </p>
                <div className="flex flex-col gap-1.5">
                  {story.cluster.map((related) => (
                    <div
                      key={related.id}
                      className="flex items-start gap-2 group"
                    >
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0 mt-0.5">
                        {formatDate(related.published_at || related.created_at)}
                      </span>
                      <SourceDot name={related.source_name} />
                      {related.source_url ? (
                        <a
                          href={related.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-foreground hover:text-accent-warm transition-colors flex items-center gap-1"
                        >
                          {related.title}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-foreground">
                          {related.title}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )})}
      </div>
    </section>
  )
}
