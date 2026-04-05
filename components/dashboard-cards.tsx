"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Cloud, Droplets, Leaf, Truck, AlertTriangle, TrendingUp } from "lucide-react"

interface DashboardCardProps {
  icon: React.ReactNode
  title: string
  status: string
  statusColor: "green" | "amber" | "red"
  metrics: { label: string; value: string }[]
  chart: number[]
  delay: number
}

function MiniChart({ data, color, id }: { data: number[]; color: string; id: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 80
    return `${x},${y}`
  }).join(" ")
  
  const gradientId = `gradient-${id}-${color.replace('#', '')}`
  
  return (
    <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashboardCard({ icon, title, status, statusColor, metrics, chart, delay }: DashboardCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.2 }
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => observer.disconnect()
  }, [delay])
  
  const chartColor = statusColor === "green" ? "#10b981" : statusColor === "amber" ? "#f59e0b" : "#ef4444"
  
  return (
    <div
      ref={cardRef}
      className={cn(
        "p-6 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10",
        "hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500",
        "group",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-white font-medium">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                statusColor === "green" ? "bg-emerald-500" : statusColor === "amber" ? "bg-amber-500" : "bg-red-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                statusColor === "green" ? "text-emerald-400" : statusColor === "amber" ? "text-amber-400" : "text-red-400"
              )}>{status}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <MiniChart data={chart} color={chartColor} id={title.replace(/\s+/g, '-').toLowerCase()} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-xs text-white/40">{metric.label}</p>
            <p className="text-lg font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const dashboardCards = [
  {
    icon: <Cloud className="w-5 h-5 text-cyan-400" />,
    title: "Monsoon Status",
    status: "Delayed",
    statusColor: "amber" as const,
    metrics: [
      { label: "Expected Arrival", value: "Jun 8" },
      { label: "Deficit", value: "-18%" },
    ],
    chart: [30, 45, 42, 38, 55, 48, 62, 58, 70, 65],
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    title: "Risk Score",
    status: "Elevated",
    statusColor: "red" as const,
    metrics: [
      { label: "National Index", value: "72/100" },
      { label: "High Risk States", value: "8" },
    ],
    chart: [50, 55, 60, 58, 65, 70, 68, 72, 75, 72],
  },
  {
    icon: <Leaf className="w-5 h-5 text-emerald-400" />,
    title: "Crop Health",
    status: "Good",
    statusColor: "green" as const,
    metrics: [
      { label: "Health Index", value: "76%" },
      { label: "Coverage", value: "94%" },
    ],
    chart: [65, 68, 70, 72, 75, 73, 76, 78, 75, 76],
  },
  {
    icon: <Truck className="w-5 h-5 text-amber-400" />,
    title: "Supply Chain",
    status: "Minor Delays",
    statusColor: "amber" as const,
    metrics: [
      { label: "Efficiency", value: "84%" },
      { label: "Active Routes", value: "12.4K" },
    ],
    chart: [88, 85, 82, 84, 80, 82, 85, 84, 83, 84],
  },
]

export default function DashboardCards() {
  return (
    <section className="relative z-10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
            <p className="text-white/50 text-sm mt-1">Key metrics at a glance</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors">
            <TrendingUp className="w-4 h-4" />
            View Full Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map((card, index) => (
            <DashboardCard key={card.title} {...card} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}
