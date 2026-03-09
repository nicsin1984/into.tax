"use client"

import { useEffect, useRef } from "react"
import type { KeyDate } from "@/lib/queries"

function daysUntil(dateStr: string) {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  return diff
}

export function DeadlineTicker({ dates }: { dates: KeyDate[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animFrame: number
    let pos = 0

    function step() {
      pos += 0.5
      if (el) {
        if (pos >= el.scrollWidth / 2) pos = 0
        el.scrollLeft = pos
      }
      animFrame = requestAnimationFrame(step)
    }
    animFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  // Filter out past dates
  const futureDates = dates.filter(d => daysUntil(d.deadline_date) > 0)

  if (futureDates.length === 0) return null

  const items = [...futureDates, ...futureDates]

  return (
    <div className="bg-[#1C1412] text-[#e8e0db] overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-center gap-8 whitespace-nowrap py-2 px-4 overflow-hidden"
        style={{ scrollBehavior: "auto" }}
      >
        {items.map((date, i) => {
          const days = daysUntil(date.deadline_date)
          const isUrgent = days <= 30
          return (
            <span key={`${date.id}-${i}`} className="flex items-center gap-2 text-xs font-mono tracking-wide">
              <span className={`font-semibold ${isUrgent ? "text-red-500" : "text-[#d4956b]"}`}>
                {days}d
              </span>
              <span className="opacity-40">|</span>
              <span className="opacity-80">{date.title}</span>
              <span className="opacity-40">
                {new Date(date.deadline_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
