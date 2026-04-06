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

