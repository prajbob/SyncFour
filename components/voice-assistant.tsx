"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [pulseWaves, setPulseWaves] = useState([1, 2, 3, 4, 5])

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setPulseWaves(prev => prev.map(() => Math.random() * 0.5 + 0.5))
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isListening])

  const toggleListening = () => {
    setIsListening(!isListening)
    setIsExpanded(!isListening)
    if (!isListening) {
      setTranscript("")
      // Simulate voice recognition feedback
      setTimeout(() => {
        setTranscript("Listening for commands...")
      }, 500)
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Expanded panel */}
      <div
        className={cn(
          "absolute bottom-20 right-0 w-80 transition-all duration-500 ease-out",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="p-5 rounded-2xl backdrop-blur-xl bg-[#0d1117]/90 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">AgroShield Voice</h3>
              <p className="text-white/50 text-xs">AI-powered assistance</p>
            </div>
          </div>
          
          {/* Voice visualization */}
          <div className="flex items-center justify-center gap-1 h-12 mb-4">
            {pulseWaves.map((height, i) => (
              <div
                key={`pulse-${i}`}
                className="w-1 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full transition-all duration-100"
                style={{
                  height: isListening ? `${height * 40}px` : "4px",
                }}
              />
            ))}
          </div>
          
          <p className="text-white/70 text-sm text-center">
            {transcript || "Click microphone to start"}
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              Try: &quot;Show me drought risk in Maharashtra&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Main button */}
      <button
        onClick={toggleListening}
        className={cn(
          "relative w-16 h-16 rounded-full transition-all duration-300",
          "flex items-center justify-center",
          "shadow-lg hover:shadow-xl",
          isListening 
            ? "bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/30" 
            : "bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50"
        )}
      >
        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-emerald-500/30 animate-pulse" />
          </>
        )}
        
        {isListening ? (
          <MicOff className="w-6 h-6 text-white relative z-10" />
        ) : (
          <Mic className="w-6 h-6 text-white/80 relative z-10" />
        )}
      </button>
      
      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs text-white/40">Voice Assistant</span>
      </div>
    </div>
  )
}
