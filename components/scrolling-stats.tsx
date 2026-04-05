"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, BarChart3, Droplets, Thermometer, Truck, Wheat, Users, MapPin } from "lucide-react"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  description: string
  delay: number
}

function AnimatedNumber({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState("0")
  const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ""))
  const suffix = value.replace(/[0-9.-]/g, "")
  
  useEffect(() => {
    let startTime: number
    const startValue = 0
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = startValue + (numericValue - startValue) * easeOutQuart
      
      if (Number.isInteger(numericValue)) {
        setDisplayValue(Math.floor(current).toLocaleString() + suffix)
      } else {
        setDisplayValue(current.toFixed(1) + suffix)
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [numericValue, suffix, duration])
  
  return <span>{displayValue}</span>
}

function StatCard({ icon, label, value, change, trend, description, delay }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.3 }
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => observer.disconnect()
  }, [delay])
  
  return (
    <div
      ref={cardRef}
      className={cn(
        "p-6 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10",
        "hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500",
        "group cursor-default",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          trend === "up" ? "bg-emerald-500/10 text-emerald-400" :
          trend === "down" ? "bg-red-500/10 text-red-400" :
          "bg-white/10 text-white/60"
        )}>
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> :
           trend === "down" ? <TrendingDown className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          {change}
        </div>
      </div>
      
      <p className="text-sm text-white/50 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white mb-2">
        {isVisible ? <AnimatedNumber value={value} /> : "0"}
      </p>
      <p className="text-xs text-white/40">{description}</p>
    </div>
  )
}

const stats = [
  {
    icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
    label: "Risk Score",
    value: "72",
    change: "+8%",
    trend: "up" as const,
    description: "National agricultural risk index - elevated due to monsoon delay"
  },
  {
    icon: <Droplets className="w-6 h-6 text-cyan-400" />,
    label: "Rainfall Deficit",
    value: "18%",
    change: "-5%",
    trend: "down" as const,
    description: "Below normal rainfall in 12 states - irrigation advisories active"
  },
  {
    icon: <Thermometer className="w-6 h-6 text-red-400" />,
    label: "Heat Index",
    value: "42°C",
    change: "+3°C",
    trend: "up" as const,
    description: "Maximum recorded temperature - heatwave conditions in 8 states"
  },
  {
    icon: <Truck className="w-6 h-6 text-amber-400" />,
    label: "Supply Chain",
    value: "84%",
    change: "-2%",
    trend: "down" as const,
    description: "Logistics efficiency score - minor delays in western corridor"
  },
  {
    icon: <Wheat className="w-6 h-6 text-yellow-400" />,
    label: "Crop Health",
    value: "76%",
    change: "+4%",
    trend: "up" as const,
    description: "Overall crop health index - Rabi season performing well"
  },
  {
    icon: <Users className="w-6 h-6 text-purple-400" />,
    label: "Farmers Reached",
    value: "2.4M",
    change: "+12%",
    trend: "up" as const,
    description: "Active users receiving real-time climate intelligence"
  },
  {
    icon: <MapPin className="w-6 h-6 text-blue-400" />,
    label: "Districts Covered",
    value: "687",
    change: "+23",
    trend: "up" as const,
    description: "Active monitoring across all major agricultural zones"
  },
]

export default function ScrollingStats() {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Real-Time Intelligence
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Live data from 687 districts powering actionable insights for millions of farmers, logistics partners, and policymakers across India.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.slice(0, 4).map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 100} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {stats.slice(4).map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={(index + 4) * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}
