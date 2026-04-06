const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${path} failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<T>
}

export async function getDashboardSummary() {
  return request<{
    top_risk_regions: Array<{
      id: number
      name: string
      state: string
      risk_score: number
      risk_level: string
      shortage_risk: number
      disruption_risk: number
    }>
    active_alerts: Array<{
      id: number
      region_id: number
      severity: string
      message: string
      status: string
      created_at: string
    }>
    system_metrics: Record<string, number>
    current_risk_snapshot: Record<string, number>
  }>("/api/dashboard/summary")
}

export async function getLocationInsight(lat: number, lon: number) {
  const latValue = Number.isFinite(lat) ? lat : 0
  const lonValue = Number.isFinite(lon) ? lon : 0
  return request<{
    input_location: {
      latitude: number
      longitude: number
      timestamp_utc: string
    }
    mapped_region: {
      id: number
      name: string
      state: string
      country: string
      distance_km: number
    }
    risk_evaluation: {
      combined_risk_score: number
      risk_level: string
      confidence: number
      shortage_risk: number
      disruption_risk: number
      explanation: string
      recommended_action: string
    }
    current_signals: {
      temperature: number
      rainfall: number
      drought_index: number
      flood_probability: number
      soil_moisture_index: number
      water_stress_index: number
      reservoir_level: number
      market_price_anomaly: number
      storage_fill_ratio: number
      route_disruption_risk: number
      satellite_flood_extent_index: number
      ndvi_anomaly: number
    }
    disaster_outlook: Array<{
      type: string
      severity: string
      message: string
    }>
    active_alerts: Array<{
      id: number
      region_id: number
      alert_type: string
      severity: string
      message: string
      status: string
      created_at: string
    }>
    recommendations: Array<{
      type: string
      priority: string
      text: string
    }>
  }>(`/api/location/insight?lat=${encodeURIComponent(String(latValue))}&lon=${encodeURIComponent(String(lonValue))}`)
}
