"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Cpu, Zap, Activity, ChevronRight } from "lucide-react"

export function DiscoveryCTA() {
    return (
        <section className="py-32 bg-black relative overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-accent/5 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-accent/10 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-accent/20 rounded-full pointer-events-none animate-pulse-slow" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-12 h-px bg-accent" />
                        <div className="w-10 h-10 border border-accent rotate-45 flex items-center justify-center">
                            <Activity className="text-accent -rotate-45" size={16} />
                        </div>
                        <div className="w-12 h-px bg-accent" />
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-8 italic italic italic">
                        Unlock Your <br />
                        <span className="text-white/40">Readiness Score</span>
                    </h2>

                    <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-12 uppercase tracking-widest font-bold max-w-2xl mx-auto">
                        Quantify your business intelligence maturity and uncover the hidden automation gaps in your infrastructure.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/ai-readiness"
                            className="group relative px-12 py-6 bg-accent text-black font-black uppercase tracking-widest text-xs overflow-hidden transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative z-10 group-hover:text-black flex items-center gap-2">
                                Start Discovery <ChevronRight size={18} />
                            </span>
                        </Link>

                        <div className="flex items-center gap-4 text-white/20">
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-accent/20 rounded-full" />)}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Analysis Node // Active</span>
                        </div>
                    </div>

                    {/* Meta Stats Panel */}
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-30">
                        {[
                            { label: "Data Depth", val: "L4" },
                            { label: "Latency", val: "2ms" },
                            { label: "Protocol", val: "G-1X" },
                            { label: "Security", val: "TLS" },
                        ].map((stat, i) => (
                            <div key={i} className="border border-white/10 p-4 font-mono text-center">
                                <div className="text-[8px] uppercase tracking-widest mb-1">{stat.label}</div>
                                <div className="text-xs font-black text-accent">{stat.val}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
