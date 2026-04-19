import Link from "next/link"
import { Linkedin } from "lucide-react"
import { SpotlightShareButtons } from "@/components/spotlight-share"
import type { Spotlight } from "@/lib/queries"

/**
 * Extract a clean display hostname from a URL (strips protocol + leading www).
 * Returns the original string if parsing fails.
 */
function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

type Props = {
  spotlight: Spotlight
  slug: string
  /**
   * When true, renders as a standalone <article> suitable for dedicated /spotlight/[slug] pages.
   * When false (default), renders inline for the archive index — preserves id={slug} anchor
   * for backwards-compatibility with existing /spotlight#slug share links.
   */
  standalone?: boolean
}

export function SpotlightCard({ spotlight: s, slug, standalone = false }: Props) {
  // Precedence: news_hook_url > source_evidence > hide
  const primaryUrl = s.news_hook_url || s.source_evidence
  const primaryLabel = s.news_hook_url
    ? (s.news_hook_label || domainFromUrl(s.news_hook_url))
    : (s.source_evidence ? domainFromUrl(s.source_evidence) : null)

  // Show secondary source line only when source_evidence is distinct from news_hook_url
  const showSecondarySource =
    !!s.source_evidence && !!s.news_hook_url && s.source_evidence !== s.news_hook_url

  return (
    <article
      id={standalone ? undefined : slug}
      className="relative bg-[#FFFDF9] rounded-lg p-8 md:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden scroll-mt-32"
    >
      {/* Decorative quotation mark */}
      <div
        className="absolute top-4 right-6 text-[120px] font-serif text-[#F5E6D8] leading-none pointer-events-none select-none"
        aria-hidden="true"
      >
        &ldquo;
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
              <span className="text-[#C4B5A5]">&middot;</span>
              <span>{s.firm}</span>
            </>
          )}
          {s.specialism && (
            <>
              <span className="text-[#C4B5A5]">&middot;</span>
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

        {/* Why they're in the spotlight - news hook block (clickable) */}
        {primaryUrl && primaryLabel && (
          <div className="mt-6 bg-[#F5F0EA] border-l-4 border-[#A0522D] rounded-r-md p-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#6B5B4F] mb-2">
              Why they&rsquo;re in the spotlight
            </h4>
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-sans italic text-[#A0522D] hover:text-[#8B4513] hover:underline transition-colors leading-relaxed"
            >
              <span>{primaryLabel}</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
            {showSecondarySource && s.source_evidence && (
              <a
                href={s.source_evidence}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-[11px] font-mono italic text-[#8B7B6B] hover:text-[#A0522D] transition-colors"
              >
                Source: {domainFromUrl(s.source_evidence)} &rarr;
              </a>
            )}
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

        {/* Permanent link to dedicated profile page (only shown on archive view) */}
        {!standalone && (
          <div className="mt-4 pt-3 border-t border-[#F0E8E0]">
            <Link
              href={`/spotlight/${slug}`}
              className="text-[11px] font-mono text-[#8B7B6B] hover:text-[#A0522D] transition-colors"
            >
              View full profile &rarr;
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
