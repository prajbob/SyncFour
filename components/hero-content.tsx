"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Sprout, Truck, Building2, ShoppingBag, ChevronRight, Map, BarChart3 } from "lucide-react"

const roles = [
  { 
    id: "farmer", 
    label: "Farmer", 
    icon: <Sprout className="w-6 h-6" />, 
    description: "Get personalized crop advisories, weather forecasts, and optimal planting schedules based on your exact location and soil conditions.",
    color: "emerald"
  },
  { 
    id: "logistics", 
    label: "Logistics", 
    icon: <Truck className="w-6 h-6" />, 
    description: "Optimize supply chain routes, predict weather-related delays, and manage cold storage inventory with real-time climate intelligence.",
    color: "cyan"
  },
  { 
    id: "government", 
    label: "Government", 
    icon: <Building2 className="w-6 h-6" />, 
    description: "Access district-level risk assessments, policy planning tools, and early warning systems for proactive disaster management.",
    color: "blue"
  },
  { 
    id: "consumer", 
    label: "Consumer", 
    icon: <ShoppingBag className="w-6 h-6" />, 
    description: "Track food supply availability, understand price forecasts, and make informed decisions about seasonal purchases.",
    color: "purple"
  },
]

interface HeroContentProps {
  onOpenMap: () => void
}

export default function HeroContent({ onOpenMap }: HeroContentProps) {
  const [mounted, setMounted] = useState(false)
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20">
      {/* Main Heading */}
      <div className={cn(
        "text-center max-w-5xl transition-all duration-1000 delay-300",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm text-white/70">Predict. Prepare. Protect.</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight text-balance">
          India&apos;s Climate Risk{" "}
          <span className="relative">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Intelligence Platform
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8">
              <path d="M0 4 Q50 0 100 4 T200 4" fill="none" stroke="url(#underline-gradient)" strokeWidth="2" />
              <defs>
                <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>
        
        <p className={cn(
          "mt-8 text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          AgroShield AI empowers farmers, logistics networks, and policymakers with real-time climate intelligence to anticipate risks and secure India&apos;s food future.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className={cn(
        "mt-10 flex flex-wrap justify-center gap-4 transition-all duration-1000 delay-600",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <button className="group px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium flex items-center gap-2 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
          <BarChart3 className="w-5 h-5" />
          Explore Dashboard
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          onClick={onOpenMap}
          className="group px-8 py-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white font-medium flex items-center gap-2 hover:bg-white/10 hover:border-white/30 transition-all duration-300"
        >
          <Map className="w-5 h-5" />
          View India Risk Map
        </button>
      </div>

      {/* Role Selection */}
      <div className={cn(
        "mt-20 w-full max-w-6xl transition-all duration-1000 delay-700",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <p className="text-center text-white/40 text-sm mb-6 uppercase tracking-wider">Select your role to get started</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role, index) => (
            <button
              key={role.id}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              className={cn(
                "group relative p-6 rounded-2xl backdrop-blur-xl transition-all duration-400 text-left",
                "border bg-white/[0.02]",
                hoveredRole === role.id 
                  ? "border-white/20 bg-white/[0.06] scale-[1.02] shadow-xl" 
                  : "border-white/10 hover:border-white/15"
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                role.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" :
                role.color === "cyan" ? "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20" :
                role.color === "blue" ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20" :
                "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20"
              )}>
                {role.icon}
              </div>
              
              {/* Label */}
              <h3 className="text-lg font-semibold text-white mb-2">{role.label}</h3>
              
              {/* Description */}
              <p className={cn(
                "text-sm text-white/40 leading-relaxed transition-all duration-300",
                hoveredRole === role.id ? "text-white/60" : ""
              )}>
                {role.description}
              </p>
              
              {/* Arrow indicator */}
              <div className={cn(
                "absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                hoveredRole === role.id ? "bg-white/10 opacity-100" : "opacity-0"
              )}>
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
