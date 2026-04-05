"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Droplets, Thermometer, Wind } from "lucide-react"
import { cn } from "@/lib/utils"

interface IndiaMapModalProps {
  isOpen: boolean
  onClose: () => void
}

const regions = [
  { id: "north", name: "North India", risk: "high", temp: "45°C", rainfall: "-32%", alert: "Severe Heatwave" },
  { id: "south", name: "South India", risk: "medium", temp: "36°C", rainfall: "+12%", alert: "Cyclone Watch" },
  { id: "east", name: "East India", risk: "low", temp: "34°C", rainfall: "+8%", alert: "Normal" },
  { id: "west", name: "West India", risk: "high", temp: "42°C", rainfall: "-28%", alert: "Drought Risk" },
  { id: "central", name: "Central India", risk: "medium", temp: "39°C", rainfall: "-15%", alert: "Heat Advisory" },
  { id: "northeast", name: "Northeast", risk: "low", temp: "28°C", rainfall: "+22%", alert: "Flood Watch" },
]

export default function IndiaMapModal({ isOpen, onClose }: IndiaMapModalProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!mounted) return null

  const selected = regions.find(r => r.id === selectedRegion)

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-5xl max-h-[90vh] overflow-auto",
          "rounded-3xl backdrop-blur-xl bg-[#0d1117]/95 border border-white/10",
          "shadow-2xl transition-all duration-500",
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-semibold text-white">India Climate Risk Map</h2>
            <p className="text-white/50 text-sm mt-1">Real-time regional risk assessment</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map visualization */}
            <div className="relative aspect-square bg-[#0a0f14] rounded-2xl overflow-hidden border border-white/5">
              {/* India outline SVG */}
              <svg viewBox="0 0 400 450" className="w-full h-full p-8">
                {/* Simplified India map regions */}
                <g className="cursor-pointer">
                  {/* North */}
                  <path
                    d="M150 50 L250 50 L280 100 L260 130 L200 120 L140 130 L120 100 Z"
                    className={cn(
                      "transition-all duration-300 stroke-white/20 stroke-[1]",
                      selectedRegion === "north" ? "fill-red-500/60" : "fill-red-500/20 hover:fill-red-500/40"
                    )}
                    onClick={() => setSelectedRegion("north")}
                  />
                  {/* Northeast */}
                  <path
                    d="M280 100 L340 90 L360 140 L320 160 L280 140 Z"
                    className={cn(
                      "transition-all duration-300 stroke-white/20 stroke-[1]",
                      selectedRegion === "northeast" ? "fill-emerald-500/60" : "fill-emerald-500/20 hover:fill-emerald-500/40"
                    )}
                    onClick={() => setSelectedRegion("northeast")}
                  />
                  {/* West */}
                  <path
                    d="M60 140 L140 130 L150 200 L130 280 L80 320 L50 280 L40 200 Z"
                    className={cn(
                      "transition-all duration-300 stroke-white/20 stroke-[1]",
                      selectedRegion === "west" ? "fill-red-500/60" : "fill-red-500/20 hover:fill-red-500/40"
                    )}
                    onClick={() => setSelectedRegion("west")}
                  />
                  {/* Central */}
                  <path
                    d="M140 130 L260 130 L270 200 L250 280 L150 280 L130 200 Z"
                    className={cn(
                      "transition-all duration-300 stroke-white/20 stroke-[1]",
                      selectedRegion === "central" ? "fill-amber-500/60" : "fill-amber-500/20 hover:fill-amber-500/40"
                    )}
                    onClick={() => setSelectedRegion("central")}
                  />
                  {/* East */}
                  <path
                    d="M260 130 L320 160 L330 240 L300 300 L270 280 L270 200 Z"
                    className={cn(
                      "transition-all duration-300 stroke-white/20 stroke-[1]",
                      selectedRegion === "east" ? "fill-emerald-500/60" : "fill-emerald-500/20 hover:fill-emerald-500/40"
                    )}
                    onClick={() => setSelectedRegion("east")}
                  />
                  {/* South */}
                  <path
                    d="M130 280 L250 280 L270 320 L220 420 L180 420 L130 320 Z"
                    className={cn(
                      "transition-all duration-300 stroke-white/20 stroke-[1]",
                      selectedRegion === "south" ? "fill-amber-500/60" : "fill-amber-500/20 hover:fill-amber-500/40"
                    )}
                    onClick={() => setSelectedRegion("south")}
                  />
                </g>
                
                {/* Region labels */}
                <text x="200" y="90" className="fill-white/60 text-[10px] text-center" textAnchor="middle">North</text>
                <text x="320" y="125" className="fill-white/60 text-[10px]" textAnchor="middle">NE</text>
                <text x="85" y="220" className="fill-white/60 text-[10px]" textAnchor="middle">West</text>
                <text x="200" y="200" className="fill-white/60 text-[10px]" textAnchor="middle">Central</text>
                <text x="300" y="230" className="fill-white/60 text-[10px]" textAnchor="middle">East</text>
                <text x="200" y="360" className="fill-white/60 text-[10px]" textAnchor="middle">South</text>
                
                {/* Animated pulse on high-risk areas */}
                <circle cx="200" cy="80" r="8" className="fill-red-500/50 animate-ping" />
                <circle cx="85" cy="210" r="8" className="fill-red-500/50 animate-ping" style={{ animationDelay: "0.5s" }} />
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500/60" />
                  <span className="text-xs text-white/50">High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500/60" />
                  <span className="text-xs text-white/50">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                  <span className="text-xs text-white/50">Low</span>
                </div>
              </div>
            </div>
            
            {/* Region details */}
            <div className="space-y-4">
              {selected ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      selected.risk === "high" ? "bg-red-500" : selected.risk === "medium" ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <h3 className="text-xl font-semibold text-white">{selected.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                        <Thermometer className="w-4 h-4" />
                        Temperature
                      </div>
                      <p className="text-2xl font-bold text-white">{selected.temp}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                        <Droplets className="w-4 h-4" />
                        Rainfall
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        selected.rainfall.startsWith("-") ? "text-red-400" : "text-emerald-400"
                      )}>{selected.rainfall}</p>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3",
                    selected.risk === "high" ? "bg-red-500/10 border border-red-500/20" :
                    selected.risk === "medium" ? "bg-amber-500/10 border border-amber-500/20" :
                    "bg-emerald-500/10 border border-emerald-500/20"
                  )}>
                    <AlertTriangle className={cn(
                      "w-5 h-5",
                      selected.risk === "high" ? "text-red-400" :
                      selected.risk === "medium" ? "text-amber-400" : "text-emerald-400"
                    )} />
                    <div>
                      <p className="text-white font-medium">{selected.alert}</p>
                      <p className="text-white/50 text-sm">Active weather advisory</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Wind className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">Select a region on the map to view details</p>
                </div>
              )}
              
              {/* All regions list */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/50 mb-3">All Regions</h4>
                {regions.map(region => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region.id)}
                    className={cn(
                      "w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200",
                      "hover:bg-white/5",
                      selectedRegion === region.id ? "bg-white/10 border border-white/20" : "bg-transparent border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        region.risk === "high" ? "bg-red-500" : region.risk === "medium" ? "bg-amber-500" : "bg-emerald-500"
                      )} />
                      <span className="text-white/80">{region.name}</span>
                    </div>
                    <span className={cn(
                      "text-sm",
                      region.risk === "high" ? "text-red-400" : region.risk === "medium" ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {region.risk.charAt(0).toUpperCase() + region.risk.slice(1)} Risk
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
