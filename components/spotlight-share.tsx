"use client"

import { useState } from "react"
import type { Spotlight } from "@/lib/queries"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function SpotlightShareButtons({ spotlight, slug }: { spotlight: Spotlight; slug: string }) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = `https://into.tax/spotlight#${slug}`
  const encodedUrl = encodeURIComponent(shareUrl)
  
  // LinkedIn share includes summary in URL
  const linkedInTitle = encodeURIComponent(`${spotlight.person_name} - into.tax Spotlight`)
  const linkedInSummary = encodeURIComponent(
    spotlight.headline || `${spotlight.person_name}, ${spotlight.job_title}${spotlight.firm ? ` at ${spotlight.firm}` : ''}`
  )
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  
  const xText = encodeURIComponent(
    `${spotlight.person_name} featured in this week's into.tax In the Spotlight${spotlight.specialism ? ` for their work in ${spotlight.specialism}` : ''} 🔦`
  )
  const xShareUrl = `https://x.com/intent/tweet?text=${xText}&url=${encodedUrl}`
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }
  
  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F0E8E0]">
      <span className="text-[10px] font-mono text-[#A0A0A0] mr-1">Share:</span>
      
      <a
        href={linkedInShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 text-[10px] font-mono text-[#8B7B6B] bg-[#F5F0EA] rounded-full hover:bg-[#A0522D] hover:text-white transition-colors"
      >
        LinkedIn
      </a>
      
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 text-[10px] font-mono text-[#8B7B6B] bg-[#F5F0EA] rounded-full hover:bg-[#A0522D] hover:text-white transition-colors"
      >
        Share on X
      </a>
      
      <button
        onClick={handleCopyLink}
        className="px-2.5 py-1 text-[10px] font-mono text-[#8B7B6B] bg-[#F5F0EA] rounded-full hover:bg-[#A0522D] hover:text-white transition-colors"
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  )
}

export function ShareThisWeekButton({ spotlights }: { spotlights: Spotlight[] }) {
  const [copied, setCopied] = useState(false)
  
  const names = spotlights.map(s => s.person_name)
  const shareUrl = "https://into.tax/spotlight"
  const encodedUrl = encodeURIComponent(shareUrl)
  
  // Format names: "name1, name2, name3, name4, and name5"
  const formattedNames = names.length > 1 
    ? `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
    : names[0] || ""
  
  const shareText = `This week's into.tax In the Spotlight features ${formattedNames}.`
  const encodedText = encodeURIComponent(shareText)
  
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  const xShareUrl = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F0EA] rounded-lg border border-[#E8DFD6]">
      <span className="text-[11px] font-mono text-[#6B5B4F]">Share this week:</span>
      
      <a
        href={linkedInShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 text-[10px] font-mono text-[#8B7B6B] bg-white rounded-full hover:bg-[#A0522D] hover:text-white transition-colors border border-[#E8DFD6]"
      >
        LinkedIn
      </a>
      
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 text-[10px] font-mono text-[#8B7B6B] bg-white rounded-full hover:bg-[#A0522D] hover:text-white transition-colors border border-[#E8DFD6]"
      >
        Share on X
      </a>
      
      <button
        onClick={handleCopyLink}
        className="px-2.5 py-1 text-[10px] font-mono text-[#8B7B6B] bg-white rounded-full hover:bg-[#A0522D] hover:text-white transition-colors border border-[#E8DFD6]"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  )
}
