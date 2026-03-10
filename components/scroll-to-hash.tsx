"use client"

import { useEffect } from "react"

export function ScrollToHash() {
  useEffect(() => {
    // Wait for the page to fully render
    const hash = window.location.hash
    if (hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }, [])

  return null
}
