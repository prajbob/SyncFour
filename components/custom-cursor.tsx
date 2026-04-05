"use client"

import { useEffect, useState } from "react"

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const updateCursorType = () => {
      const hoveredElement = document.elementFromPoint(position.x, position.y)
      const isClickable = hoveredElement?.closest('button, a, [role="button"], input, select, textarea')
      setIsPointer(!!isClickable)
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)
    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener("mousemove", updatePosition)
    window.addEventListener("mouseover", updateCursorType)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("mousemove", updatePosition)
      window.removeEventListener("mouseover", updateCursorType)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [position.x, position.y])

  if (!isVisible) return null

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Outer glow layers */}
      <div
        className="absolute rounded-full transition-all duration-200 ease-out"
        style={{
          width: isPointer ? 80 : isClicking ? 50 : 60,
          height: isPointer ? 80 : isClicking ? 50 : 60,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: isPointer 
            ? "radial-gradient(circle, rgba(0,255,163,0.15) 0%, rgba(0,255,163,0) 70%)"
            : "radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0) 70%)",
          filter: "blur(8px)",
        }}
      />
      
      {/* Middle glow ring */}
      <div
        className="absolute rounded-full transition-all duration-150 ease-out"
        style={{
          width: isPointer ? 50 : isClicking ? 30 : 40,
          height: isPointer ? 50 : isClicking ? 30 : 40,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: isPointer 
            ? "radial-gradient(circle, rgba(0,255,163,0.25) 0%, rgba(0,255,163,0.08) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.05) 50%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />
      
      {/* Core glow */}
      <div
        className="absolute rounded-full transition-all duration-100 ease-out"
        style={{
          width: isPointer ? 24 : isClicking ? 16 : 20,
          height: isPointer ? 24 : isClicking ? 16 : 20,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: isPointer 
            ? "radial-gradient(circle, rgba(0,255,163,0.6) 0%, rgba(0,255,163,0.2) 60%, transparent 100%)"
            : "radial-gradient(circle, rgba(56,189,248,0.5) 0%, rgba(56,189,248,0.15) 60%, transparent 100%)",
          boxShadow: isPointer 
            ? "0 0 20px rgba(0,255,163,0.5), 0 0 40px rgba(0,255,163,0.3)"
            : "0 0 15px rgba(56,189,248,0.4), 0 0 30px rgba(56,189,248,0.2)",
        }}
      />
      
      {/* Center bright dot */}
      <div
        className="absolute rounded-full transition-all duration-75"
        style={{
          width: isPointer ? 6 : isClicking ? 4 : 5,
          height: isPointer ? 6 : isClicking ? 4 : 5,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: isPointer ? "rgba(200,255,230,0.95)" : "rgba(200,230,255,0.9)",
          boxShadow: isPointer 
            ? "0 0 8px rgba(0,255,163,0.8), 0 0 16px rgba(0,255,163,0.6)"
            : "0 0 6px rgba(56,189,248,0.7), 0 0 12px rgba(56,189,248,0.5)",
        }}
      />
    </div>
  )
}
