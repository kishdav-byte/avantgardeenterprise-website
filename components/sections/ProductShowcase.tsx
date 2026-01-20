"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Shield, Zap, Activity } from "lucide-react"

const slides = [
    {
        image: "/showcase/command-center-1.png",
        title: "AI Control Panel",
        description: "Manage your assistant's personality, knowledge base, and voice in real-time.",
        features: ["Precision Controls", "Custom Personas", "Global Settings"]
    },
    {
        image: "/showcase/command-center-2.png",
        title: "Unified Command",
        description: "The orchestration layer for your digital workforce, engineered to eliminate manual bottlenecks.",
        features: ["Gemini Flash", "OpenAI Nuance", "Adaptive Scaling"]
    },
    {
        image: "/showcase/command-center-3.png",
        title: "Intelligence Portal",
        description: "A centralized hub to launch and manage sophisticated AI voice and text interactions.",
        features: ["Operational Status", "Fast Injections", "Secure Access"]
    }
]

export function ProductShowcase() {
    const [current, setCurrent] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        if (isHovered) return
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [isHovered])

    const next = () => setCurrent((prev) => (prev + 1) % slides.length)
    const prev = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1))

    return (
        <section className="py-32 bg-black overflow-hidden relative">
            {/* Background Branding */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none hidden lg:block">
                <span className="text-[15vw] font-black uppercase tracking-tighter italic">AVANT-GARDE</span>
            </div>

            <div className="container mx-auto px-6">
                <header className="mb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-px bg-accent" />
                        <span className="text-accent text-[10px] font-bold uppercase tracking-[0.4em]">Product Intelligence</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] italic">
                        The Command<br />
                        <span className="text-white/40">Center // Elite</span>
                    </h2>
                </header>

                <div
                    className="relative"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        {/* Info Section */}
                        <div className="lg:col-span-4 order-2 lg:order-1">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={current}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic italic">{slides[current].title}</h3>
                                        <p className="text-white/40 text-sm leading-relaxed uppercase tracking-widest font-bold">
                                            {slides[current].description}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {slides[current].features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-1 h-1 bg-accent rotate-45" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8 flex gap-4">
                                        <button
                                            onClick={prev}
                                            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-accent hover:text-accent transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={next}
                                            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-accent hover:text-accent transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Image Section */}
                        <div className="lg:col-span-8 order-1 lg:order-2">
                            <div className="relative group overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-4 md:p-8 backdrop-blur-xl">
                                <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent pointer-events-none" />

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={current}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.05, y: -10 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl"
                                    >
                                        <img
                                            src={slides[current].image}
                                            alt={slides[current].title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Decorative Status Bar */}
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {slides.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 transition-all rounded-full ${i === current ? 'w-12 bg-accent' : 'w-4 bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                        <span>ENCRYPTED_FEED // VERIFIED</span>
                                        <Activity size={10} className="text-accent animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
