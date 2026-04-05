"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Menu, X, Bell, Settings, Shield, Zap, Globe } from "lucide-react"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState("Dashboard")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Dashboard", icon: Globe },
    { name: "Risk Map", icon: Shield },
    { name: "Analytics", icon: Zap },
    { name: "Alerts", icon: Bell },
  ]

  return (
    <nav
      className={cn(
        "relative mx-auto mt-3 mb-2 w-fit transition-all duration-700",
        "rounded-2xl overflow-hidden",
        scrolled 
          ? "bg-black/60 shadow-2xl shadow-cyan-500/10" 
          : "bg-black/30"
      )}
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden">
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl",
            scrolled 
              ? "bg-[linear-gradient(90deg,rgba(0,255,163,0.3)_0%,rgba(0,200,255,0.3)_50%,rgba(0,255,163,0.3)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.1)_100%)]"
          )}
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
          }}
        />
      </div>

      <div className="relative px-2 py-2">
        <div className="flex items-center gap-1">
          {/* Logo with animated ring */}
          <div className="flex items-center gap-3 pl-3 pr-4">
            <div className="relative">
              {/* Pulsing ring */}
              <div className="absolute inset-0 w-11 h-11 -m-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-50 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-white tracking-tight text-lg">
                Agro<span className="text-emerald-400">Shield</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider">AI Powered</span>
              </div>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveItem(item.name)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                    isActive 
                      ? "text-white" 
                      : "text-white/50 hover:text-white/80"
                  )}
                >
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30"
                      style={{ animation: "fadeIn 0.2s ease-out" }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", isActive && "text-emerald-400")} />
                  <span className="relative z-10">{item.name}</span>
                </button>
              )
            })}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-1 pl-2">
            {/* Notification button with badge */}
            <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 group">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black/50 animate-pulse" />
            </button>
            
            {/* Settings button */}
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 group">
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            </button>
            
            {/* Login button with gradient */}
            <button className="relative px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">Get Started</span>
            </button>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden relative border-t border-white/10 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveItem(item.name)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300",
                  activeItem === item.name
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-5 h-5", activeItem === item.name && "text-emerald-400")} />
                <span className="font-medium">{item.name}</span>
              </button>
            )
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </nav>
  )
}
