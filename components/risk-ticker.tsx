"use client"

import { cn } from "@/lib/utils"

const riskAlerts = [
  { type: "critical", region: "Punjab", message: "Extreme heatwave - Agricultural operations at risk", temp: "47°C" },
  { type: "warning", region: "Maharashtra", message: "Drought conditions intensifying - Water shortage alert", rainfall: "-45%" },
  { type: "critical", region: "Rajasthan", message: "Sandstorm advisory - Visibility under 500m", wind: "65 km/h" },
  { type: "info", region: "Kerala", message: "Monsoon onset expected in 3 days - Prepare for heavy rainfall", rainfall: "+120%" },
  { type: "warning", region: "Bihar", message: "Flood risk elevated - River levels rising", level: "Danger" },
  { type: "critical", region: "Gujarat", message: "Cyclone watch active - Coastal areas on alert", category: "Cat-2" },
  { type: "info", region: "Tamil Nadu", message: "Favorable conditions for paddy cultivation", advisory: "Plant now" },
  { type: "warning", region: "Uttar Pradesh", message: "Cold storage demand surge - Supply chain stress", demand: "+180%" },
]

export default function RiskTicker() {
  return (
    <div className="w-full overflow-hidden">
      <div className="relative py-3 bg-gradient-to-r from-[#050a12] via-[#050a12]/95 to-[#050a12] border-b border-white/5">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050a12] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050a12] to-transparent z-10" />
        
        {/* Breaking news label */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Risk Alerts</span>
        </div>
        
        {/* Scrolling content */}
        <div className="animate-marquee flex gap-16 whitespace-nowrap pl-32">
          {[...riskAlerts, ...riskAlerts].map((alert, index) => (
            <div key={`alert-${index}-${alert.region}`} className="flex items-center gap-3">
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                alert.type === "critical" ? "bg-red-500/20 text-red-400" :
                alert.type === "warning" ? "bg-amber-500/20 text-amber-400" :
                "bg-emerald-500/20 text-emerald-400"
              )}>
                {alert.type}
              </div>
              <span className="text-white/80 font-medium">{alert.region}:</span>
              <span className="text-white/60">{alert.message}</span>
              {alert.temp && <span className="text-red-400 font-mono text-sm">{alert.temp}</span>}
              {alert.rainfall && <span className={cn("font-mono text-sm", alert.rainfall.startsWith("-") ? "text-red-400" : "text-emerald-400")}>{alert.rainfall}</span>}
              {alert.wind && <span className="text-amber-400 font-mono text-sm">{alert.wind}</span>}
              {alert.level && <span className="text-red-400 font-mono text-sm">{alert.level}</span>}
              {alert.category && <span className="text-red-400 font-mono text-sm">{alert.category}</span>}
              {alert.advisory && <span className="text-emerald-400 font-mono text-sm">{alert.advisory}</span>}
              {alert.demand && <span className="text-amber-400 font-mono text-sm">{alert.demand}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
