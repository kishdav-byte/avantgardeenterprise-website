"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import Link from "next/link"

export default function PortfolioPage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
            <div>
                <Navbar />

                <section className="pt-40 pb-20 px-4">
                    <div className="container mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-20 text-center"
                        >
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6">
                                Selected <span className="text-accent">Works</span>
                            </h1>
                            <p className="text-white/50 tracking-wide text-sm">Featured Case Studies & Creative Deployments</p>
                        </motion.div>

                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="group relative bg-[#100f1c]/40 border border-white/5 p-8 md:p-12 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-accent/30"
                            >
                                {/* Aurora glow behind */}
                                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                                    <div className="flex-1 space-y-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider">
                                            AI Career Coach
                                        </div>
                                        
                                        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-white group-hover:text-accent transition-colors">
                                            Total Package Interview
                                        </h3>
                                        
                                        <p className="text-white/60 leading-relaxed text-sm md:text-base">
                                            A comprehensive path to career excellence. Empowering candidates through an automated 3-stage job search process—Diagnose, Prepare, Perfect—leveraging advanced behavioral analysis and speech diagnostics.
                                        </p>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
                                            <span>Production Launch: 2025</span>
                                            <span>•</span>
                                            <span>Interactive Web Application</span>
                                        </div>
                                        
                                        <div className="pt-2">
                                            <a
                                                href="https://www.totalpackageinterview.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-accent rounded-full hover:bg-accent hover:text-background text-white text-xs font-semibold tracking-wide transition-all bg-white/[0.03] backdrop-blur-md"
                                            >
                                                Visit Platform
                                            </a>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex relative z-10 w-24 h-24 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02] group-hover:border-accent group-hover:bg-accent/10 transition-all duration-500 transform group-hover:scale-105 shrink-0">
                                        <span className="text-3xl text-white/70 group-hover:text-accent transition-colors">↗</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
