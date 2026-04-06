const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

type RequestMethod = "GET" | "POST" | "PATCH"

async function request<T>(path: string, method: RequestMethod = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${path} failed (${response.status}): ${text}`)
  }
  return response.json() as Promise<T>
}

export interface RegionRisk {
  id: number
  name: string
  country: string
  state: string
  latitude: number
  longitude: number
  priority_level: number
  risk_score: number
  risk_level: string
  shortage_risk: number
  disruption_risk: number
  confidence?: number
}

export interface AlertItem {
  id: number
  region_id: number
  alert_type: string
  severity: string
  message: string
  status: string
  created_at: string
  reason?: string
  recommended_action?: string
}

export interface DashboardSummary {
  top_risk_regions: RegionRisk[]
  active_alerts: AlertItem[]
  system_metrics: Record<string, number>
  current_risk_snapshot: Record<string, number>
}

export interface DashboardMapFeature {
  type: "Feature"
  properties: {
    region_id: number
    name: string
    state: string
    country: string
    risk_score: number
    risk_level: string
    shortage_risk: number
    disruption_risk: number
  }
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

export interface DashboardMapData {
  type: "FeatureCollection"
  features: DashboardMapFeature[]
}

export interface RegionDetailResponse {
  region: {
    id: number
    name: string
    country: string
    state: string
    latitude: number
    longitude: number
    priority_level: number
  }
  prediction: {
    region_id: number
    crop_id?: number | null
    forecast_horizon_days: number
    shortage_risk: number
    disruption_risk: number
    combined_risk_score: number
    risk_level: string
    confidence: number
    explanation: string
    recommended_action: string
    signal_snapshot?: Record<string, number>
  }
  climate_summary: Record<string, unknown>
  climate_history: Array<Record<string, unknown>>
  crop_patterns: Array<Record<string, unknown>>
  crop_stress: Record<string, unknown>
  routes: Array<Record<string, unknown>>
  api_replacement_signals: Record<string, number>
  alert_history: AlertItem[]
  recommended_actions: Array<{ type: string; priority: string; text: string }>
}

export interface LocationInsight {
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
    wind_speed_kph?: number
    weather_condition?: string
    weather_source?: string
    soil_moisture_percent?: number
    soil_moisture_risk_band?: string
    soil_moisture_source?: string
  }
  soil_moisture_guidance?: {
    as_of?: string
    advisory?: string
    seed_suggestions: Array<{
      name: string
      fit: string
    }>
  }
  disaster_outlook: Array<{
    type: string
    severity: string
    message: string
  }>
  active_alerts: AlertItem[]
  recommendations: Array<{
    type: string
    priority: string
    text: string
  }>
}

export async function getDashboardSummary() {
  return request<DashboardSummary>("/api/dashboard/summary")
}

export async function getDashboardMapData() {
  return request<DashboardMapData>("/api/dashboard/map-data")
}

export async function getRegions(params?: { search?: string; risk_level?: string; sort_by?: string; order?: string }) {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.risk_level) query.set("risk_level", params.risk_level)
  if (params?.sort_by) query.set("sort_by", params.sort_by)
  if (params?.order) query.set("order", params.order)
  const suffix = query.size > 0 ? `?${query.toString()}` : ""
  return request<{ count: number; items: RegionRisk[] }>(`/api/regions${suffix}`)
}

export async function getRegionDetail(regionId: number) {
  return request<RegionDetailResponse>(`/api/regions/${regionId}`)
}

export async function getAlerts(status?: string) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : ""
  return request<{ count: number; items: AlertItem[] }>(`/api/alerts${suffix}`)
}

export async function generateAlerts() {
  return request<{ generated: number; items: AlertItem[] }>("/api/alerts/generate", "POST")
}

export async function predictRisk(payload: {
  region_id: number
  crop_id?: number
  forecast_horizon_days?: number
  override_signals?: Record<string, number>
}) {
  return request<{
    region_id: number
    crop_id?: number | null
    forecast_horizon_days: number
    shortage_risk: number
    disruption_risk: number
    combined_risk_score: number
    risk_level: string
    confidence: number
    explanation: string
    recommended_action: string
    signal_snapshot?: Record<string, number>
  }>("/api/predict/risk", "POST", payload)
}

export async function getLocationInsight(lat: number, lon: number) {
  const latValue = Number.isFinite(lat) ? lat : 0
  const lonValue = Number.isFinite(lon) ? lon : 0
  return request<LocationInsight>(
    `/api/location/insight?lat=${encodeURIComponent(String(latValue))}&lon=${encodeURIComponent(String(lonValue))}`
  )
}
