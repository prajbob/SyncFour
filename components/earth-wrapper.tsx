"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const EarthScene = dynamic(() => import("@/components/earth-scene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0" style={{ background: "radial-gradient(ellipse at 70% 40%, #0a1628 0%, #000000 100%)", zIndex: 0 }} />
  ),
})

export default function EarthWrapper() {
  return (
    <Suspense fallback={<div className="fixed inset-0" style={{ background: "radial-gradient(ellipse at 70% 40%, #0a1628 0%, #000000 100%)", zIndex: 0 }} />}>
      <EarthScene />
    </Suspense>
  )
}
