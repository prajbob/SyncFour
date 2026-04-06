"use client"

import { useState, useEffect } from "react"
import RiskTicker from "@/components/risk-ticker"
import HeroContent from "@/components/hero-content"
import ScrollingStats from "@/components/scrolling-stats"
import DashboardCards from "@/components/dashboard-cards"
import IndiaMapModal from "@/components/india-map-modal"
import VoiceAssistant from "@/components/voice-assistant"
import CustomCursor from "@/components/custom-cursor"
import EarthWrapper from "@/components/earth-wrapper"

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("Initializing AgroShield AI...")

  useEffect(() => {
    const messages = [
      "Initializing AgroShield AI...",
      "Loading climate data...",
      "Connecting to satellite feeds...",
      "Analyzing risk patterns...",
      "Ready."
    ]

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15
        if (next >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        setMessage(messages[Math.floor((next / 100) * (messages.length - 1))])
        return next
      })
    }, 200)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[200] bg-[#050a12] flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mb-8 animate-pulse">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      {/* Progress bar */}
      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Message */}
      <p className="text-white/50 text-sm">{message}</p>
    </div>
  )
}

export default function Home() {
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    // Check if device has mouse
    const hasMouse = window.matchMedia("(pointer: fine)").matches
    setShowCursor(hasMouse)
  }, [])

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: "#050a12" }}>
      {/* Custom cursor - only on desktop */}
      {showCursor && <CustomCursor />}
      
      {/* Fixed 3D Earth Background - lowest z-index */}
      <EarthWrapper />
      
      {/* Fixed UI elements */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <RiskTicker />
      </div>
      
      {/* Scrollable Content Layer */}
      <div className="relative z-10 pointer-events-none">
        {/* Hero Section - Full viewport */}
        <section className="min-h-screen pointer-events-auto">
          <HeroContent onOpenMap={() => setIsMapOpen(true)} />
        </section>
        
        {/* Dashboard Cards Section */}
        <section className="relative pointer-events-auto" style={{ backgroundColor: "rgba(5, 10, 18, 0.95)" }}>
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-[#050a12]" style={{ top: "-8rem" }} />
          <DashboardCards />
        </section>
        
        {/* Scrolling Stats Section */}
        <section className="relative pointer-events-auto" style={{ backgroundColor: "#050a12" }}>
          <ScrollingStats />
        </section>
        
        {/* Footer */}
        <footer className="relative py-16 pointer-events-auto" style={{ backgroundColor: "#050a12" }}>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">AgroShield AI</span>
            </div>
            <p className="text-white/40 text-sm">Securing India&apos;s food future with climate intelligence</p>
            <p className="text-white/20 text-xs mt-4">2026 AgroShield India. All rights reserved.</p>
          </div>
        </footer>
      </div>
      
      {/* Modals and overlays - highest z-index */}
      <IndiaMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
      <VoiceAssistant />
    </main>
  )
}
