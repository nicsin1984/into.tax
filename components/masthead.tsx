"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Moon, Sun, TreePine, Egg, Flame, Heart, Sparkles, Crown, Leaf, Snowflake, Cherry, Ghost, Star, Candy, Citrus, Clover, Music } from "lucide-react"
import Link from "next/link"

// UK holidays with date ranges (month is 0-indexed)
// Each holiday shows for 4 days: 2 days before and 2 days after the main date
type Holiday = {
  name: string
  month: number
  day: number
  icon: typeof TreePine
  color: string
}

// Lunar calendar holidays - dates by year (month is 0-indexed)
// Updated through 2030
const LUNAR_HOLIDAYS: Record<string, Record<number, { month: number; day: number }>> = {
  "Chinese New Year": {
    2024: { month: 1, day: 10 },h
    2025: { month: 0, day: 29 },
    2026: { month: 1, day: 17 },
    2027: { month: 1, day: 6 },
    2028: { month: 0, day: 26 },
    2029: { month: 1, day: 13 },
    2030: { month: 1, day: 3 },
  },
  "Easter": {
    2024: { month: 2, day: 31 },
    2025: { month: 3, day: 20 },
    2026: { month: 3, day: 5 },
    2027: { month: 2, day: 28 },
    2028: { month: 3, day: 16 },
    2029: { month: 3, day: 1 },
    2030: { month: 3, day: 21 },
  },
  "Diwali": {
    2024: { month: 10, day: 1 },
    2025: { month: 9, day: 20 },
    2026: { month: 10, day: 8 },
    2027: { month: 9, day: 29 },
    2028: { month: 9, day: 17 },
    2029: { month: 10, day: 5 },
    2030: { month: 9, day: 26 },
  },
  "Hanukkah": {
    2024: { month: 11, day: 25 },
    2025: { month: 11, day: 14 },
    2026: { month: 11, day: 4 },
    2027: { month: 11, day: 24 },
    2028: { month: 11, day: 12 },
    2029: { month: 11, day: 1 },
    2030: { month: 11, day: 20 },
  },
  "Eid al-Fitr": {
    2024: { month: 3, day: 10 },
    2025: { month: 2, day: 30 },
    2026: { month: 2, day: 20 },
    2027: { month: 2, day: 9 },
    2028: { month: 1, day: 26 },
    2029: { month: 1, day: 14 },
    2030: { month: 1, day: 4 },
  },
  "Eid al-Adha": {
    2024: { month: 5, day: 16 },
    2025: { month: 5, day: 6 },
    2026: { month: 4, day: 27 },
    2027: { month: 4, day: 16 },
    2028: { month: 4, day: 5 },
    2029: { month: 3, day: 24 },
    2030: { month: 3, day: 13 },
  },
}

// Fixed date holidays
const FIXED_HOLIDAYS: Holiday[] = [
  // Seasonal
  { name: "Spring Equinox", month: 2, day: 20, icon: Cherry, color: "text-pink-400" },
  { name: "Summer Solstice", month: 5, day: 21, icon: Sun, color: "text-yellow-500" },
  { name: "Autumn Equinox", month: 8, day: 22, icon: Leaf, color: "text-amber-600" },
  { name: "Winter Solstice", month: 11, day: 21, icon: Snowflake, color: "text-blue-400" },
  
  // UK National
  { name: "New Year", month: 0, day: 1, icon: Sparkles, color: "text-yellow-500" },
  { name: "Burns Night", month: 0, day: 25, icon: Music, color: "text-blue-500" },
  { name: "Valentine's Day", month: 1, day: 14, icon: Heart, color: "text-red-500" },
  { name: "St Patrick's Day", month: 2, day: 17, icon: Clover, color: "text-green-500" },
  { name: "St George's Day", month: 3, day: 23, icon: Crown, color: "text-red-600" },
  { name: "Halloween", month: 9, day: 31, icon: Ghost, color: "text-orange-400" },
  { name: "Bonfire Night", month: 10, day: 5, icon: Flame, color: "text-orange-500" },
  { name: "Remembrance Day", month: 10, day: 11, icon: Flower, color: "text-red-600" },
  { name: "Christmas", month: 11, day: 25, icon: TreePine, color: "text-green-600" },
]

// Lunar holiday definitions (icons/colors)
const LUNAR_HOLIDAY_DEFS: Record<string, { icon: typeof TreePine; color: string }> = {
  "Chinese New Year": { icon: Citrus, color: "text-red-500" },
  "Easter": { icon: Egg, color: "text-purple-500" },
  "Diwali": { icon: Candy, color: "text-amber-500" },
  "Hanukkah": { icon: Star, color: "text-blue-500" },
  "Eid al-Fitr": { icon: Star, color: "text-emerald-500" },
  "Eid al-Adha": { icon: Star, color: "text-emerald-500" },
}

// Build full holiday list for current year
function getHolidaysForYear(year: number): Holiday[] {
  const holidays = [...FIXED_HOLIDAYS]
  
  for (const [name, dates] of Object.entries(LUNAR_HOLIDAYS)) {
    const yearData = dates[year]
    const def = LUNAR_HOLIDAY_DEFS[name]
    if (yearData && def) {
      holidays.push({
        name,
        month: yearData.month,
        day: yearData.day,
        icon: def.icon,
        color: def.color,
      })
    }
  }
  
  return holidays
}

// Custom Flower icon for Remembrance Day (poppy)
function Flower({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8" />
      <path d="M19.07 4.93a4 4 0 0 1-5.66 5.66 4 4 0 0 1 5.66-5.66" />
      <path d="M22 12a4 4 0 0 1-8 0 4 4 0 0 1 8 0" />
      <path d="M19.07 19.07a4 4 0 0 1-5.66-5.66 4 4 0 0 1 5.66 5.66" />
      <path d="M12 22a4 4 0 0 1 0-8 4 4 0 0 1 0 8" />
      <path d="M4.93 19.07a4 4 0 0 1 5.66-5.66 4 4 0 0 1-5.66 5.66" />
      <path d="M2 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0" />
      <path d="M4.93 4.93a4 4 0 0 1 5.66 5.66 4 4 0 0 1-5.66-5.66" />
    </svg>
  )
}

function getActiveHoliday(): Holiday | null {
  const now = new Date()
  const year = now.getFullYear()
  const holidays = getHolidaysForYear(year)
  
  for (const holiday of holidays) {
    // Check if within 2 days before or after the holiday
    const holidayDate = new Date(year, holiday.month, holiday.day)
    const diffDays = Math.abs((now.getTime() - holidayDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 2) {
      return holiday
    }
  }
  return null
}

function HolidayIcon() {
  const [holiday, setHoliday] = useState<Holiday | null>(null)
  
  useEffect(() => {
    setHoliday(getActiveHoliday())
  }, [])
  
  if (!holiday) return null
  
  const Icon = holiday.icon
  return (
    <Icon 
      className={`h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 ${holiday.color} animate-pulse`} 
      aria-label={holiday.name}
    />
  )
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

export function Masthead() {
  const handleSearchClick = useCallback(() => {
    // Dispatch custom event for search
    window.dispatchEvent(new CustomEvent("openSearch"))
  }, [])
  const [time, setTime] = useState("")
  const [dark, setDark] = useState<boolean | null>(null)

  // Initialize theme from cookie on mount
  useEffect(() => {
    const stored = getCookie("theme")
    const isDark = stored === "dark"
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  // Clock
  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Europe/London",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle("dark", next)
      setCookie("theme", next ? "dark" : "light")
      return next
    })
  }, [])

  // Keyboard shortcut: 'd' to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      if (e.key === "d" || e.key === "D") {
        toggleDark()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleDark])

  const editionDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        {/* Mobile: date + clock on one row */}
        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground mb-2 md:hidden">
          <span>{editionDate}</span>
          <span className="tabular-nums">{time || "--:--:--"} GMT</span>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Desktop date */}
          <p className="text-xs font-mono text-muted-foreground tracking-wide hidden md:block">
            {editionDate}
          </p>
          
          {/* Title with Holiday Icon */}
          <div className="text-center flex-1 md:flex-none">
            <div className="flex items-center justify-center gap-2">
              <HolidayIcon />
              <h1 className="text-[28px] md:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground">
                into.tax
              </h1>
              <HolidayIcon />
            </div>
            <p className="text-[9px] md:text-xs font-mono text-muted-foreground tracking-widest uppercase mt-0.5 md:mt-1">
              UK Tax Intelligence
            </p>
          </div>
          
          {/* Desktop clock + icons */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs font-mono text-muted-foreground tabular-nums hidden md:inline">
              {time || "--:--:--"} <span className="text-[10px] opacity-60">GMT</span>
            </span>
                            <Link href="/blog" className="hidden md:inline-flex items-center text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-2 py-1 hover:bg-accent">Blog</Link>Link></Link>
            <button
              aria-label="Search"
              onClick={handleSearchClick}
              className="p-3 md:p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 flex items-center justify-center"
            >
              <Search className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              aria-label="Toggle dark mode (D)"
              onClick={toggleDark}
              className="p-3 md:p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 flex items-center justify-center"
            >
              {dark ? <Sun className="h-5 w-5 md:h-4 md:w-4" /> : <Moon className="h-5 w-5 md:h-4 md:w-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
