"use client"

import { useEffect } from "react"

export function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash
    console.log("[v0] ScrollToHash - hash:", hash)
    
    if (hash) {
      // Longer delay to ensure page is fully rendered
      setTimeout(() => {
        const element = document.getElementById(hash.slice(1))
        console.log("[v0] ScrollToHash - element found:", !!element)
        
        if (element) {
          const yOffset = -140 // Account for masthead + ticker
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: "smooth" })
        }
      }, 300)
    }
  }, [])

  return null
}
