"use client"

import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Gauge,
  Globe,
  Layers,
  LayoutDashboard,
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Truck,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  type AlertItem,
  type DashboardMapData,
  type DashboardSummary,
  type LocationInsight,
  type RegionDetailResponse,
  type RegionRisk,
  generateAlerts,
  getAlerts,
  getDashboardMapData,
  getDashboardSummary,
  getLocationInsight,
  getRegionDetail,
  getRegions,
} from "@/lib/api"

type TabId = "dashboard" | "regions" | "alerts" | "analytics" | "location"

const tabs: Array<{ id: TabId; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "regions", label: "Regions", icon: Globe },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "location", label: "My Location", icon: LocateFixed },
]

function toTitleCase(value: string) {
  if (!value) return "Unknown"
  const normalized = value.toLowerCase()
  return normalized[0].toUpperCase() + normalized.slice(1)
}

function riskColor(level: string) {
  const normalized = (level || "").toLowerCase()
  if (normalized === "critical") return "text-red-400"
  if (normalized === "high") return "text-orange-400"
  if (normalized === "medium") return "text-amber-400"
  return "text-emerald-400"
}

export function CommandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [mapData, setMapData] = useState<DashboardMapData | null>(null)
  const [regions, setRegions] = useState<RegionRisk[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const [regionDetail, setRegionDetail] = useState<RegionDetailResponse | null>(null)
  const [regionLoading, setRegionLoading] = useState(false)
  const [regionError, setRegionError] = useState<string | null>(null)

  const [locationInsight, setLocationInsight] = useState<LocationInsight | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [summaryRes, mapRes, regionsRes, alertsRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardMapData(),
        getRegions({ sort_by: "risk_score", order: "desc" }),
        getAlerts(),
      ])

      setSummary(summaryRes)
      setMapData(mapRes)
      setRegions(regionsRes.items)
      setAlerts(alertsRes.items)
      if (!selectedRegionId && regionsRes.items.length > 0) {
        setSelectedRegionId(regionsRes.items[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load backend data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (!selectedRegionId) return
    let cancelled = false
    const run = async () => {
      try {
        setRegionLoading(true)
        setRegionError(null)
        const details = await getRegionDetail(selectedRegionId)
        if (!cancelled) setRegionDetail(details)
      } catch (err: unknown) {
        if (!cancelled) {
          setRegionError(err instanceof Error ? err.message : "Failed to load region detail.")
          setRegionDetail(null)
        }
      } finally {
        if (!cancelled) setRegionLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [selectedRegionId])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.")
      return
    }
    setLocationLoading(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const insight = await getLocationInsight(position.coords.latitude, position.coords.longitude)
          setLocationInsight(insight)
        } catch (err: unknown) {
          setLocationError(err instanceof Error ? err.message : "Failed to load location insight.")
        } finally {
          setLocationLoading(false)
        }
      },
      (geoErr) => {
        setLocationLoading(false)
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setLocationError("Location access denied. Allow location permission to get local climate and disaster insights.")
        } else {
          setLocationError("Could not fetch your location. Try again.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    )
  }

  const filteredRegions = useMemo(() => {
    const token = search.trim().toLowerCase()
    if (!token) return regions
    return regions.filter(
      (item) => item.name.toLowerCase().includes(token) || item.state.toLowerCase().includes(token)
    )
  }, [regions, search])

  const filteredAlerts = useMemo(() => {
    const token = search.trim().toLowerCase()
    if (!token) return alerts
    return alerts.filter(
      (item) =>
        item.message.toLowerCase().includes(token) ||
        item.alert_type.toLowerCase().includes(token) ||
        String(item.region_id).includes(token)
    )
  }, [alerts, search])

  const analytics = useMemo(() => {
    if (regions.length === 0) {
      return {
        avgRisk: 0,
        highOrCritical: 0,
        medium: 0,
        low: 0,
        avgShortage: 0,
        avgDisruption: 0,
      }
    }

    const avgRisk = regions.reduce((acc, item) => acc + item.risk_score, 0) / regions.length
    const avgShortage = regions.reduce((acc, item) => acc + item.shortage_risk, 0) / regions.length
    const avgDisruption = regions.reduce((acc, item) => acc + item.disruption_risk, 0) / regions.length

    return {
      avgRisk: Number(avgRisk.toFixed(4)),
      highOrCritical: regions.filter((item) => ["high", "critical"].includes(item.risk_level)).length,
      medium: regions.filter((item) => item.risk_level === "medium").length,
      low: regions.filter((item) => item.risk_level === "low").length,
      avgShortage: Number(avgShortage.toFixed(4)),
      avgDisruption: Number(avgDisruption.toFixed(4)),
    }
  }, [regions])

  const handleGenerateAlerts = async () => {
    try {
      await generateAlerts()
      const alertsRes = await getAlerts()
      setAlerts(alertsRes.items)
      const summaryRes = await getDashboardSummary()
      setSummary(summaryRes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate alerts.")
    }
  }

  const renderDashboardTab = () => (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Regions</p>
          <p className="text-3xl font-bold mt-2">{summary?.system_metrics.total_regions ?? 0}</p>
        </div>
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Active Alerts</p>
          <p className="text-3xl font-bold mt-2">{summary?.system_metrics.active_alerts ?? 0}</p>
        </div>
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Average Risk</p>
          <p className="text-3xl font-bold mt-2">{summary?.system_metrics.avg_risk_score ?? 0}</p>
        </div>
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Blocked Routes</p>
          <p className="text-3xl font-bold mt-2">{summary?.system_metrics.blocked_routes ?? 0}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-5">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Top Risk Regions
          </h3>
          <div className="space-y-3">
            {summary?.top_risk_regions.map((region) => (
              <div key={region.id} className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold">{region.name}</p>
                    <p className="text-xs text-slate-400">{region.state}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold uppercase ${riskColor(region.risk_level)}`}>
                      {region.risk_level}
                    </p>
                    <p className="text-xs text-slate-400">Score {region.risk_score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141a20] border border-white/10 rounded-xl p-5">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Map Layer Signals
          </h3>
          <div className="space-y-2">
            {mapData?.features.slice(0, 8).map((feature) => (
              <div key={feature.properties.region_id} className="grid grid-cols-12 gap-2 text-xs bg-[#0f151d] border border-white/5 rounded px-3 py-2">
                <div className="col-span-4 text-slate-300">{feature.properties.name}</div>
                <div className={`col-span-2 uppercase ${riskColor(feature.properties.risk_level)}`}>
                  {feature.properties.risk_level}
                </div>
                <div className="col-span-3 text-slate-400">Shortage {feature.properties.shortage_risk}</div>
                <div className="col-span-3 text-slate-400">Disrupt {feature.properties.disruption_risk}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const renderRegionsTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <section className="xl:col-span-5 bg-[#141a20] border border-white/10 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3">Regions</h3>
        <div className="space-y-2 max-h-[68vh] overflow-auto pr-1">
          {filteredRegions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegionId(region.id)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-3 transition-colors",
                selectedRegionId === region.id
                  ? "bg-cyan-500/10 border-cyan-400/40"
                  : "bg-[#0f151d] border-white/5 hover:bg-[#18212d]"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{region.name}</p>
                <span className={`text-xs uppercase font-semibold ${riskColor(region.risk_level)}`}>{region.risk_level}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {region.state}, score {region.risk_score}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="xl:col-span-7 bg-[#141a20] border border-white/10 rounded-xl p-5">
        <h3 className="text-lg font-bold mb-3">Region Intelligence</h3>
        {regionLoading && (
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading region detail...
          </div>
        )}
        {!regionLoading && regionError && <p className="text-red-300 text-sm">{regionError}</p>}
        {!regionLoading && !regionError && regionDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase">Risk Level</p>
                <p className={`text-lg font-bold mt-1 uppercase ${riskColor(regionDetail.prediction.risk_level)}`}>
                  {regionDetail.prediction.risk_level}
                </p>
                <p className="text-xs text-slate-400">Score {regionDetail.prediction.combined_risk_score}</p>
              </div>
              <div className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase">Confidence</p>
                <p className="text-lg font-bold mt-1">{regionDetail.prediction.confidence}</p>
                <p className="text-xs text-slate-400">Forecast {regionDetail.prediction.forecast_horizon_days} days</p>
              </div>
            </div>

            <div className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase mb-1">Explanation</p>
              <p className="text-sm text-slate-200">{regionDetail.prediction.explanation}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase mb-2">Climate Summary</p>
                <p className="text-xs text-slate-300">
                  Avg Temp {String(regionDetail.climate_summary.avg_temperature ?? "n/a")}
                </p>
                <p className="text-xs text-slate-300">
                  Avg Drought {String(regionDetail.climate_summary.avg_drought_index ?? "n/a")}
                </p>
                <p className="text-xs text-slate-300">
                  Avg Flood {String(regionDetail.climate_summary.avg_flood_probability ?? "n/a")}
                </p>
              </div>
              <div className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase mb-2">External Signals</p>
                <p className="text-xs text-slate-300">
                  Soil Moisture {regionDetail.api_replacement_signals.soil_moisture_index ?? 0}
                </p>
                <p className="text-xs text-slate-300">
                  Water Stress {regionDetail.api_replacement_signals.water_stress_index ?? 0}
                </p>
                <p className="text-xs text-slate-300">
                  Market Anomaly {regionDetail.api_replacement_signals.market_price_anomaly ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-[#0f151d] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase mb-2">Recommended Actions</p>
              <div className="space-y-2">
                {regionDetail.recommended_actions.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="text-xs text-slate-200">
                    <span className="font-semibold uppercase mr-2">{item.priority}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )

  const renderAlertsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Alerts Control</h3>
        <button
          onClick={handleGenerateAlerts}
          className="px-3 py-2 bg-cyan-500/20 text-cyan-200 rounded-lg border border-cyan-500/40 text-sm hover:bg-cyan-500/30 transition-colors"
        >
          Generate Alerts Now
        </button>
      </div>
      <div className="space-y-2">
        {filteredAlerts.map((item) => (
          <div key={item.id} className="bg-[#141a20] border border-white/10 rounded-lg p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm">{item.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Type {item.alert_type} | Region {item.region_id} | Status {item.status}
                </p>
              </div>
              <span className={`text-xs uppercase font-bold ${riskColor(item.severity)}`}>{item.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Average Risk</p>
          <p className="text-3xl font-bold mt-2">{analytics.avgRisk}</p>
        </div>
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">High/Critical Regions</p>
          <p className="text-3xl font-bold mt-2">{analytics.highOrCritical}</p>
        </div>
        <div className="bg-[#141a20] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Average Disruption</p>
          <p className="text-3xl font-bold mt-2">{analytics.avgDisruption}</p>
        </div>
      </section>

      <section className="bg-[#141a20] border border-white/10 rounded-xl p-5">
        <h3 className="text-lg font-bold mb-4">Risk Distribution</h3>
        <div className="space-y-3">
          {[
            { label: "High + Critical", value: analytics.highOrCritical, color: "bg-red-400" },
            { label: "Medium", value: analytics.medium, color: "bg-amber-400" },
            { label: "Low", value: analytics.low, color: "bg-emerald-400" },
          ].map((item) => {
            const total = Math.max(regions.length, 1)
            const width = `${Math.round((item.value / total) * 100)}%`
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 bg-[#0f151d] rounded-full overflow-hidden">
                  <div className={cn("h-full", item.color)} style={{ width }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )

  const renderLocationTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Location-Based Insight</h3>
        <button
          onClick={requestLocation}
          className="px-3 py-2 bg-cyan-500/20 text-cyan-200 rounded-lg border border-cyan-500/40 text-sm hover:bg-cyan-500/30 transition-colors"
        >
          Detect My Location
        </button>
      </div>

      {locationLoading && (
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Fetching location and personalized climate-risk data...
        </div>
      )}
      {!locationLoading && locationError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200">{locationError}</div>
      )}

      {!locationLoading && !locationError && locationInsight && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Nearest Region</p>
              <p className="font-semibold mt-1">{locationInsight.mapped_region.name}</p>
              <p className="text-xs text-slate-400">
                {locationInsight.mapped_region.state}, {locationInsight.mapped_region.country}
              </p>
            </div>
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Risk Evaluation</p>
              <p className={`font-semibold mt-1 uppercase ${riskColor(locationInsight.risk_evaluation.risk_level)}`}>
                {locationInsight.risk_evaluation.risk_level}
              </p>
              <p className="text-xs text-slate-400">Score {locationInsight.risk_evaluation.combined_risk_score}</p>
            </div>
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Distance</p>
              <p className="font-semibold mt-1">{locationInsight.mapped_region.distance_km} km</p>
              <p className="text-xs text-slate-400">from your coordinates</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Temperature</p>
              <p className="font-semibold mt-1">{locationInsight.current_signals.temperature} C</p>
            </div>
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Rainfall</p>
              <p className="font-semibold mt-1">{locationInsight.current_signals.rainfall} mm</p>
            </div>
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Soil Moisture</p>
              <p className="font-semibold mt-1">
                {locationInsight.current_signals.soil_moisture_percent !== undefined
                  ? `${locationInsight.current_signals.soil_moisture_percent}%`
                  : `${locationInsight.current_signals.soil_moisture_index}`}
              </p>
            </div>
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Flood Prob.</p>
              <p className="font-semibold mt-1">{locationInsight.current_signals.flood_probability}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Current Weather</p>
              <p className="font-semibold mt-1">
                {locationInsight.current_signals.weather_condition || "Not available"}
              </p>
            </div>
            <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase">Wind Speed</p>
              <p className="font-semibold mt-1">
                {locationInsight.current_signals.wind_speed_kph !== undefined
                  ? `${locationInsight.current_signals.wind_speed_kph} kph`
                  : "Not available"}
              </p>
            </div>
          </div>

          {locationInsight.soil_moisture_guidance?.seed_suggestions?.length ? (
            <div className="bg-[#141a20] border border-emerald-500/30 rounded-lg p-3">
              <p className="text-xs text-emerald-300 uppercase mb-1">Soil Moisture Seed Guidance</p>
              <p className="text-sm text-slate-200">
                {locationInsight.soil_moisture_guidance.advisory || "Seed guidance generated from moisture conditions."}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Risk Band: {toTitleCase(locationInsight.current_signals.soil_moisture_risk_band || "unknown")}
                {locationInsight.soil_moisture_guidance.as_of ? ` | Data Date: ${locationInsight.soil_moisture_guidance.as_of}` : ""}
              </p>
              <div className="space-y-2 mt-3">
                {locationInsight.soil_moisture_guidance.seed_suggestions.map((seed, idx) => (
                  <div key={`${seed.name}-${idx}`} className="bg-[#0f151d] border border-white/5 rounded p-2">
                    <p className="text-sm font-medium text-emerald-200">{seed.name}</p>
                    <p className="text-xs text-slate-400">{seed.fit}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-[#141a20] border border-white/10 rounded-lg p-3">
            <p className="text-xs text-slate-500 uppercase mb-2">Disaster Outlook</p>
            <div className="space-y-2">
              {locationInsight.disaster_outlook.map((item, idx) => (
                <div key={`${item.type}-${idx}`} className="bg-[#0f151d] border border-white/5 rounded p-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm capitalize">{item.type.replace("-", " ")}</p>
                    <span className={`text-xs uppercase font-semibold ${riskColor(item.severity)}`}>{toTitleCase(item.severity)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboardTab()
      case "regions":
        return renderRegionsTab()
      case "alerts":
        return renderAlertsTab()
      case "analytics":
        return renderAnalyticsTab()
      case "location":
        return renderLocationTab()
      default:
        return renderDashboardTab()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] text-[#eaeef6]">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0e1419] to-[#0a0f14] border-r border-white/5 z-40 p-6">
        <div className="mb-10">
          <p className="text-2xl font-bold text-[#81ecff] tracking-tight">AgroShield</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Inner Command Center</p>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  activeTab === tab.id ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-200" : "text-slate-400 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 text-[10px] text-slate-500 uppercase tracking-widest">
          Backend Linked
          <div className="mt-2 h-1 bg-[#1a2027] rounded-full overflow-hidden">
            <div className="h-full w-full bg-cyan-400" />
          </div>
        </div>
      </aside>

      <header className="fixed left-64 right-0 top-0 h-16 bg-[#0a0f14]/85 backdrop-blur-lg border-b border-white/5 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <p className="text-sm font-semibold tracking-wide">Operational Intelligence Panel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search region/alert"
              className="pl-9 pr-3 py-2 rounded-lg bg-[#141a20] border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
            />
          </div>
          <button
            onClick={loadAllData}
            className="px-3 py-2 rounded-lg bg-[#141a20] border border-white/10 text-sm hover:bg-[#1a232e] transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="ml-64 pt-20 p-6 pb-12">
        {loading ? (
          <div className="min-h-[40vh] flex items-center gap-2 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting frontend to backend data streams...
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-200 text-sm">{error}</p>
            <p className="text-red-200/80 text-xs mt-2">
              Confirm backend is running on {`http://localhost:8000`} or set `NEXT_PUBLIC_API_BASE_URL`.
            </p>
          </div>
        ) : (
          renderActiveTab()
        )}
      </main>

      <footer className="fixed left-64 right-0 bottom-0 h-8 bg-slate-950 border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
          Data sync active
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-cyan-400" />
          Region-aware risk telemetry
        </span>
        <span className="flex items-center gap-2">
          <Truck className="w-3 h-3 text-cyan-400" />
          Route intelligence online
        </span>
      </footer>
    </div>
  )
}
