"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie_notice")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const dismissBanner = () => {
    localStorage.setItem("cookie_notice", "seen")
    setIsClosing(true)
    setTimeout(() => setShowBanner(false), 300)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#f8fafc] border-t border-[#e2e8f0] px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 ${
          isClosing ? "translate-y-full opacity-0" : "animate-[slideUp_0.4s_ease]"
        }`}
      >
        <p className="text-[13.5px] text-[#64748b] flex-1 leading-relaxed">
          <strong className="text-[#334155]">We use essential cookies only.</strong> into.tax does not use tracking or advertising cookies.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowPanel(true)}
            className="text-[#64748b] text-[13px] underline hover:text-[#334155] transition-colors bg-transparent border-none cursor-pointer"
          >
            Read more
          </button>
          <button
            onClick={dismissBanner}
            className="bg-[#334155] text-white px-5 py-2 rounded text-[13px] font-medium hover:bg-[#1e293b] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>

      {/* Read More Panel Overlay */}
      {showPanel && (
        <div 
          className="fixed inset-0 bg-[rgba(11,31,58,0.55)] z-[1000] flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPanel(false)
          }}
        >
          <div className="bg-white w-full max-w-[600px] rounded-t-xl px-8 py-8 animate-[panelUp_0.3s_ease]">
            <div className="flex justify-between items-start mb-5">
              <h3 className="font-serif text-lg font-bold text-[#0B1F3A]">About our cookies</h3>
              <button 
                onClick={() => setShowPanel(false)}
                className="text-[#94a3b8] hover:text-[#0B1F3A] leading-none bg-transparent border-none cursor-pointer pl-3"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-[#4A5568] leading-relaxed">
                We keep our use of cookies to the minimum needed to keep the site working. We do not use advertising, tracking, or analytics cookies.
              </p>

              <div className="bg-[#f8fafc] border border-[#dde3ea] rounded-md p-4">
                <strong className="block text-[13px] font-medium text-[#0B1F3A] mb-1">Essential cookies — always on</strong>
                <span className="text-[13px] text-[#4A5568]">Required for security and basic site functionality. One cookie remembers that you have seen this notice so it does not reappear on every visit.</span>
              </div>

              <div className="bg-[#f8fafc] border border-[#dde3ea] rounded-md p-4">
                <strong className="block text-[13px] font-medium text-[#0B1F3A] mb-1">Analytics — cookieless</strong>
                <span className="text-[13px] text-[#4A5568]">We use cookieless analytics to understand site traffic. It works without cookies and stores nothing on your device.</span>
              </div>

              <p className="text-sm text-[#4A5568] leading-relaxed pt-2">
                There is nothing to opt in or out of. If you have questions, see our full Cookie Policy or contact us at{" "}
                <a href="mailto:hello@into.tax" className="text-[#0D9E8C] underline hover:text-[#0B1F3A]">hello@into.tax</a>.
              </p>

              <div className="text-right pt-2">
                <button
                  onClick={() => {
                    dismissBanner()
                    setShowPanel(false)
                  }}
                  className="bg-[#0D9E8C] text-white px-5 py-2 rounded text-[13px] font-medium hover:bg-[#0b8878] transition-colors"
                >
                  Got it
                </button>
              </div>

              <p className="text-right text-xs text-[#94a3b8]">
                <a href="/cookies" className="text-[#0D9E8C] hover:text-[#0B1F3A]">Read full Cookie Policy</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
