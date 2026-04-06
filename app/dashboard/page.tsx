"use client"

import { useEffect, useState } from "react"

import CustomCursor from "@/components/custom-cursor"
import { CommandCenter } from "@/components/inner/CommandCenter"

export default function DashboardPage() {
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    const hasMouse = window.matchMedia("(pointer: fine)").matches
    setShowCursor(hasMouse)
  }, [])

  return (
    <main>
      {showCursor && <CustomCursor />}
      <CommandCenter />
    </main>
  )
}

