"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Play, StopCircle, Zap, Loader2, Sparkles, MessageSquare, Maximize2, Monitor } from "lucide-react"
import { SPORTS_CLIPS_CONFIG } from "@/lib/sports-clips-config"

export function SportsClipsEditor() {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [response, setResponse] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const startScreenShare = async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" } as any,
                audio: false
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }

            mediaStream.getVideoTracks()[0].onended = () => {
                stopScreenShare()
            }
        } catch (err) {
            console.error("Error starting screen share:", err)
            setError("Failed to access screen share. Please ensure permissions are granted.")
        }
    }

    const stopScreenShare = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const analyzeScreen = async () => {
        if (!videoRef.current || !canvasRef.current || !stream) return

        setIsAnalyzing(true)
        setError(null)

        try {
            const canvas = canvasRef.current
            const video = videoRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Could not get canvas context")

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const base64Image = canvas.toDataURL("image/jpeg", 0.8)

            const res = await fetch("/api/admin/sports-clips-editor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64Image,
                    prompt: "Analyze my DaVinci Resolve workspace and provide guidance on my current project."
                })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setResponse(data.message)
        } catch (err: any) {
            console.error("Analysis error:", err)
            setError(err.message || "Failed to analyze screen.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Feed */}
                <div className="lg:col-span-12 xl:col-span-8">
                    <div className="relative aspect-video bg-black/80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                        <AnimatePresence mode="wait">
                            {!stream ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                                >
                                    <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-6 border border-accent/20">
                                        <Monitor className="text-accent" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">No Active Feed</h3>
                                    <p className="text-white/40 max-w-md mx-auto mb-8 uppercase text-xs tracking-widest leading-relaxed">
                                        {SPORTS_CLIPS_CONFIG.ui.selectWindow}
                                    </p>
                                    <button
                                        onClick={startScreenShare}
                                        className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-accent transition-all flex items-center gap-2 group-hover:scale-105"
                                    >
                                        <Play size={16} />
                                        {SPORTS_CLIPS_CONFIG.ui.startSharing}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative w-full h-full"
                                >
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-contain bg-black"
                                    />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <div className="bg-black/60 backdrop-blur-md border border-accent/30 px-3 py-1 rounded-full text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                            Live Workspace
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                                        <button
                                            onClick={analyzeScreen}
                                            disabled={isAnalyzing}
                                            className="px-6 py-3 bg-accent text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            {isAnalyzing ? SPORTS_CLIPS_CONFIG.ui.processing : SPORTS_CLIPS_CONFIG.ui.analyze}
                                        </button>
                                        <button
                                            onClick={stopScreenShare}
                                            className="px-6 py-3 bg-red-500/20 border border-red-500/40 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <StopCircle size={16} />
                                            {SPORTS_CLIPS_CONFIG.ui.stopSharing}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>

                {/* AI Assistant Output */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex-1 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Zap size={120} />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/30 text-accent">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black uppercase tracking-tighter italic">AI Editor Assistant</h4>
                                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">DaVinci Protocol Active</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[300px] pr-2 space-y-6">
                            {!response && !error && !isAnalyzing && (
                                <div className="h-full flex flex-col items-center justify-center text-center text-white/30 italic">
                                    <MessageSquare size={32} className="mb-4 opacity-10" />
                                    <p className="text-sm">Select your screen and click<br />"Analyze" to get started.</p>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-4 bg-white/5 rounded-full w-3/4" />
                                    <div className="h-4 bg-white/5 rounded-full w-full" />
                                    <div className="h-4 bg-white/5 rounded-full w-2/3" />
                                    <div className="h-4 bg-white/5 rounded-full w-5/6" />
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                        ⚠️ Error: {error}
                                    </p>
                                </div>
                            )}

                            {response && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white/80 leading-relaxed text-sm whitespace-pre-line prose prose-invert prose-sm max-w-none"
                                >
                                    {response}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tips Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: <Maximize2 size={16} />, title: "Full Screen Mock", text: "Choose 'Entire Screen' for multi-monitor support." },
                    { icon: <Monitor size={16} />, title: "Single Window", text: "Select 'Window' to isolate DaVinci Resolve." },
                    { icon: <Sparkles size={16} />, title: "AI Precision", text: "Ensure your primary timeline is clearly visible." }
                ].map((item, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent/60">
                            {item.icon}
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{item.title}</h5>
                            <p className="text-[11px] font-bold text-white/30 uppercase tracking-tight">{item.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
