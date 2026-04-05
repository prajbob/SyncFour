"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Speech types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // 🎤 INIT
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech synthesis
      synthRef.current = window.speechSynthesis;

      // Speech recognition
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setTranscript("Listening...");
        };

        recognitionRef.current.onresult = async (event: any) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            handleAI(finalTranscript);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (e: any) => {
          console.error(e);
          setTranscript("Error: " + e.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  // 🔊 SPEAK FUNCTION
  const speak = (text: string) => {
    if (!synthRef.current) return;

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // 🤖 AI CALL
  const handleAI = async (text: string) => {
    try {
      setTranscript(`You said: "${text}"`);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const reply = data.reply || "No response";

      setTranscript(reply);
      speak(reply);
    } catch (error) {
      console.error(error);
      setTranscript("Error connecting to AI");
    }
  };

  // 🎤 BUTTON
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setTranscript("Speech not supported");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* PANEL */}
      <div
        className={cn(
          "absolute bottom-20 right-0 w-80 transition-all",
          isExpanded
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="p-5 rounded-2xl bg-black/80 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="text-white" />
            <div>
              <h3 className="text-white text-sm">AgroShield Voice</h3>
              <p className="text-white/50 text-xs">
                {isSpeaking ? "Speaking..." : "AI Assistant"}
              </p>
            </div>

            {isSpeaking && (
              <button onClick={stopSpeaking} className="ml-auto text-white">
                ⏹
              </button>
            )}
          </div>

          <p className="text-white text-sm text-center min-h-[3rem]">
            {transcript || "Click mic to start"}
          </p>
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={toggleListening}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          isListening
            ? "bg-green-500 animate-pulse"
            : isSpeaking
            ? "bg-blue-500"
            : "bg-black border border-white/20"
        )}
      >
        {isListening ? (
          <MicOff className="text-white" />
        ) : (
          <Mic className="text-white" />
        )}
      </button>
    </div>
  );
}