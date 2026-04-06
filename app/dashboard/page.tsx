"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, ChevronLeft, MapPin, ShieldAlert, TrendingUp } from "lucide-react"

import CustomCursor from "@/components/custom-cursor"
import { getDashboardSummary, getLocationInsight } from "@/lib/api"

type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>
type LocationInsight = Awaited<ReturnType<typeof getLocationInsight>>

function formatLevel(level: string) {
  const normalized = (level || "").toLowerCase()
  if (!normalized) return "unknown"
  return normalized[0].toUpperCase() + normalized.slice(1)
}

function riskColor(level: string) {
  const normalized = (level || "").toLowerCase()
  if (normalized === "critical") return "text-red-400"
  if (normalized === "high") return "text-orange-400"
  if (normalized === "medium") return "text-amber-400"
  return "text-emerald-400"
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCursor, setShowCursor] = useState(false)

  const [locationInsight, setLocationInsight] = useState<LocationInsight | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const hasMouse = window.matchMedia("(pointer: fine)").matches
    setShowCursor(hasMouse)
  }, [])

  useEffect(() => {
    let cancelled = false
    getDashboardSummary()
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadLocationInsight = () => {
    if (!navigator.geolocation) {
      setLocationAllowed(false)
      setLocationError("Geolocation is not supported in this browser.")
      return
    }

    setLocationLoading(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationAllowed(true)
          const insight = await getLocationInsight(position.coords.latitude, position.coords.longitude)
          setLocationInsight(insight)
        } catch (err) {
          setLocationError(err instanceof Error ? err.message : "Failed to load location-specific insight.")
        } finally {
          setLocationLoading(false)
        }
      },
      (geoError) => {
        setLocationAllowed(false)
        setLocationLoading(false)
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError("Location access was denied. Allow location to get personalized risk warnings.")
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setLocationError("Location information is unavailable at the moment.")
        } else if (geoError.code === geoError.TIMEOUT) {
          setLocationError("Location request timed out. Try again.")
        } else {
          setLocationError("Unable to retrieve your location.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    )
  }

  useEffect(() => {
    loadLocationInsight()
  }, [])

  const metrics = useMemo(() => data?.system_metrics ?? {}, [data])
  const snapshot = useMemo(() => data?.current_risk_snapshot ?? {}, [data])

  return (
    <main className="min-h-screen bg-[#050a12] text-white px-6 py-8">
      {showCursor && <CustomCursor />}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-cyan-400" />
              Live Risk Dashboard
            </h1>
            <p className="text-white/60 mt-2">Data source: backend API at `GET /api/dashboard/summary`</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back Home
          </Link>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Your Location Insight
            </h2>
            <button
              onClick={loadLocationInsight}
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-sm hover:bg-white/10 transition-colors"
            >
              Refresh Location Insight
            </button>
          </div>

          {locationLoading && <p className="text-white/70">Detecting your location and loading personalized insight...</p>}

          {!locationLoading && locationError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-200 text-sm">{locationError}</p>
              {locationAllowed === false && (
                <p className="text-amber-100/80 text-xs mt-2">
                  Enable browser location permission to get local disaster warnings and climate risk.
                </p>
              )}
            </div>
          )}

          {!locationLoading && !locationError && locationInsight && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Nearest Monitored Region</p>
                  <p className="font-semibold mt-1">{locationInsight.mapped_region.name}</p>
                  <p className="text-sm text-white/60">
                    {locationInsight.mapped_region.state}, {locationInsight.mapped_region.country}
                  </p>
                  <p className="text-xs text-white/50 mt-1">Distance: {locationInsight.mapped_region.distance_km} km</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Risk Evaluation</p>
                  <p className={`font-semibold mt-1 ${riskColor(locationInsight.risk_evaluation.risk_level)}`}>
                    {formatLevel(locationInsight.risk_evaluation.risk_level)}
                  </p>
                  <p className="text-sm text-white/60">Score: {locationInsight.risk_evaluation.combined_risk_score}</p>
                  <p className="text-xs text-white/50 mt-1">Confidence: {locationInsight.risk_evaluation.confidence}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Primary Warning</p>
                  <p className="text-sm text-white/80 mt-1">{locationInsight.risk_evaluation.recommended_action}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Temperature</p>
                  <p className="text-lg font-semibold">{locationInsight.current_signals.temperature} C</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Rainfall</p>
                  <p className="text-lg font-semibold">{locationInsight.current_signals.rainfall} mm</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Soil Moisture</p>
                  <p className="text-lg font-semibold">{locationInsight.current_signals.soil_moisture_index}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-white/50">Flood Probability</p>
                  <p className="text-lg font-semibold">{locationInsight.current_signals.flood_probability}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white/90 mb-2">Disaster Outlook</p>
                <div className="space-y-2">
                  {locationInsight.disaster_outlook.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize">{item.type.replace("-", " ")}</p>
                        <span className={`text-xs uppercase font-semibold ${riskColor(item.severity)}`}>{item.severity}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {locationInsight.active_alerts.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-2">Active Alerts Near You</p>
                  <div className="space-y-2">
                    {locationInsight.active_alerts.map((alert) => (
                      <div key={alert.id} className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm">{alert.message}</p>
                          <span className={`text-xs uppercase font-semibold ${riskColor(alert.severity)}`}>{alert.severity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {loading && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">Loading dashboard data...</div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            <p className="font-semibold mb-2">Could not load data</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">
              Make sure backend is running on `http://localhost:8000` or set `NEXT_PUBLIC_API_BASE_URL`.
            </p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-white/50 text-sm">Total Regions</p>
                <p className="text-2xl font-bold mt-1">{metrics.total_regions ?? 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-white/50 text-sm">Active Alerts</p>
                <p className="text-2xl font-bold mt-1">{metrics.active_alerts ?? 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-white/50 text-sm">Avg Risk Score</p>
                <p className="text-2xl font-bold mt-1">{metrics.avg_risk_score ?? 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-white/50 text-sm">Blocked Routes</p>
                <p className="text-2xl font-bold mt-1">{metrics.blocked_routes ?? 0}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Top Risk Regions
                </h2>
                <div className="space-y-3">
                  {data.top_risk_regions.map((region) => (
                    <div key={region.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{region.name}</p>
                        <p className={`text-sm font-semibold ${riskColor(region.risk_level)}`}>
                          {formatLevel(region.risk_level)}
                        </p>
                      </div>
                      <p className="text-sm text-white/60 mt-1">{region.state}</p>
                      <p className="text-sm text-white/70 mt-2">Score: {region.risk_score}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Risk Snapshot
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
                    <p className="text-white/50 text-sm">Critical</p>
                    <p className="text-2xl font-bold text-red-400">{snapshot.critical_count ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
                    <p className="text-white/50 text-sm">High</p>
                    <p className="text-2xl font-bold text-orange-400">{snapshot.high_count ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
                    <p className="text-white/50 text-sm">Medium</p>
                    <p className="text-2xl font-bold text-amber-400">{snapshot.medium_count ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
                    <p className="text-white/50 text-sm">Low</p>
                    <p className="text-2xl font-bold text-emerald-400">{snapshot.low_count ?? 0}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Active Alerts
              </h2>
              {data.active_alerts.length === 0 ? (
                <p className="text-white/60">No active alerts.</p>
              ) : (
                <div className="space-y-2">
                  {data.active_alerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm">{alert.message}</p>
                        <span className={`text-xs font-semibold uppercase ${riskColor(alert.severity)}`}>{alert.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

