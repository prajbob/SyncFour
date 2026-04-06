"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, ChevronLeft, ShieldAlert, TrendingUp } from "lucide-react"

import CustomCursor from "@/components/custom-cursor"
import { getDashboardSummary } from "@/lib/api"

type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>

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
