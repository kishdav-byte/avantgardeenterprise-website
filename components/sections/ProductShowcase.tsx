"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Activity } from "lucide-react"

export interface ShowcaseSlide {
    image: string
    title: string
    description: string
    features: string[]
}

export const commandCenterSlides: ShowcaseSlide[] = [
    {
        image: "/showcase/command-center-1.png",
        title: "AI Control Panel",
        description: "Manage your assistant's personality, knowledge base, and voice in real-time.",
        features: ["Personality Tuning", "Knowledge Base Injections", "Voice Selection"]
    },
    {
        image: "/showcase/command-center-2.png",
        title: "AI Command Center",
        description: "Select an interface to manage your AI workforce effectively.",
        features: ["Operational Status", "Admin Dashboard", "Assistant Controls"]
    }
]

export function ProductShowcase({ slides = commandCenterSlides }: { slides?: ShowcaseSlide[] }) {
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
        <section className="py-24 bg-black/40 border border-white/5 rounded-[40px] overflow-hidden relative backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <span className="text-[10vw] font-black uppercase tracking-tighter italic">VIRTUAL</span>
            </div>

            <div className="container mx-auto px-6">
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
                                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic italic text-accent">{slides[current].title}</h3>
                                        <p className="text-white/40 text-[11px] leading-relaxed uppercase tracking-widest font-bold">
                                            {slides[current].description}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {slides[current].features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-1 h-1 bg-accent rotate-45" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 font-mono italic">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8 flex gap-4">
                                        <button
                                            onClick={prev}
                                            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-accent hover:text-accent transition-all bg-black/50"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            onClick={next}
                                            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-accent hover:text-accent transition-all bg-black/50"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Image Section */}
                        <div className="lg:col-span-8 order-1 lg:order-2">
                            <div className="relative group overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-2 md:p-4 backdrop-blur-xl">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={current}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.02 }}
                                        transition={{ duration: 0.4 }}
                                        className="relative aspect-video rounded-xl overflow-hidden shadow-2xl"
                                    >
                                        <img
                                            src={slides[current].image}
                                            alt={slides[current].title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Decorative Status Bar */}
                                <div className="mt-4 flex items-center justify-between px-2">
                                    <div className="flex gap-2">
                                        {slides.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 transition-all rounded-full ${i === current ? 'w-8 bg-accent' : 'w-2 bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
                                        <span>SYSTEM_SYNC_0{current + 1}</span>
                                        <Activity size={8} className="text-accent animate-pulse" />
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
