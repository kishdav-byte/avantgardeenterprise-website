"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Cpu, Zap, Activity, ChevronRight } from "lucide-react"

export function DiscoveryCTA() {
    return (
        <section className="py-32 bg-background relative overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-secondary/5 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-accent/5 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-accent/10 rounded-full pointer-events-none animate-pulse-slow" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-accent rounded-full" />
                        <div className="w-10 h-10 rounded-full border border-secondary/20 bg-secondary/5 flex items-center justify-center relative">
                            {/* Pulsing mint active dot */}
                            <div className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_var(--accent)] animate-pulse" />
                            <Activity className="text-secondary" size={16} />
                        </div>
                        <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-secondary rounded-full" />
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-8 italic">
                        Unlock Your <br />
                        <span className="text-white/40">Readiness Score</span>
                    </h2>

                    <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
                        Quantify your business intelligence maturity and uncover the hidden automation gaps in your infrastructure.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/ai-readiness"
                            className="group relative px-10 py-4 border border-accent rounded-full hover:bg-accent hover:text-background text-accent text-sm font-semibold tracking-wide transition-all bg-accent/5 backdrop-blur-md"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Start Discovery <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>

                        <div className="flex items-center gap-4 text-white/40">
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-accent/30 rounded-full" />)}
                            </div>
                            <span className="text-xs font-semibold tracking-wider text-white/50">Analysis node active</span>
                        </div>
                    </div>

                    {/* Meta Stats Panel */}
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
                        {[
                            { label: "Data Depth", val: "L4" },
                            { label: "Latency", val: "2ms" },
                            { label: "Protocol", val: "G-1X" },
                            { label: "Security", val: "TLS" },
                        ].map((stat, i) => (
                            <div key={i} className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 text-center backdrop-blur-sm shadow-sm">
                                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{stat.label}</div>
                                <div className="text-sm font-bold text-accent">{stat.val}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
