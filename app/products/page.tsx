"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Cpu, Globe, Mic, ShieldCheck, Zap, BookOpen } from "lucide-react"
import Link from "next/link"

export default function ProductsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* HERO */}
            <section className="pt-48 pb-24 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-accent/5 blur-[100px] pointer-events-none" />

                <div className="container mx-auto max-w-6xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-24"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6">
                            Intelligent <span className="text-accent">Tools</span>
                        </h1>
                        <p className="text-white/40 uppercase tracking-[0.4em] text-sm max-w-2xl mx-auto">
                            Specialized software engineered to replace manual bottlenecks.
                        </p>
                    </motion.div>

                    {/* PRODUCT 1: AI COMMAND CENTER */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-32 group"
                    >
                        {/* Visual Side */}
                        <div className="relative order-2 lg:order-1 lg:col-span-5">
                            <div className="aspect-square lg:aspect-video bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative backdrop-blur-sm group-hover:border-accent/30 transition-colors">
                                {/* Abstract UI visualization */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 rounded-full border border-accent/20 flex items-center justify-center animate-pulse-slow">
                                        <div className="w-48 h-48 rounded-full border border-accent/40 flex items-center justify-center">
                                            <Bot size={64} className="text-accent" />
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Badges */}
                                <div className="absolute top-8 left-8 bg-black/80 backdrop-blur border border-white/10 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest text-white/70">
                                    Gemini Flash
                                </div>
                                <div className="absolute bottom-8 right-8 bg-black/80 backdrop-blur border border-white/10 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest text-white/70">
                                    OpenAI GST
                                </div>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="order-1 lg:order-2 lg:col-span-7">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
                                AI Command Center
                            </h2>
                            <p className="text-accent text-sm font-bold uppercase tracking-[0.2em] mb-8">
                                The Orchestration Layer for Your Digital Workforce
                            </p>

                            <p className="text-white/70 leading-relaxed mb-8 text-lg">
                                Replace static reception with a dynamic, multi-modal AI workforce. By unifying the power of Google Gemini and OpenAI, the Command Center serves as the central brain for managing intelligent voice assistants that adapt to your brand identity in real-time.
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Dual-Core Intelligence:</strong> Gemini Speed + OpenAI Nuance</span>
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Adaptive Personas:</strong> 11+ distinct voice personalities</span>
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Scale:</strong> Handle unlimited concurrent calls 24/7</span>
                                </li>
                            </ul>

                            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-accent transition-colors">
                                Request Enterprise Access <ArrowRight size={16} />
                            </Link>
                        </div>
                    </motion.div>

                    {/* PRODUCT 2: TOTAL PACKAGE INTERVIEW */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32 group"
                    >
                        {/* Content Side */}
                        <div className="lg:col-span-7">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
                                Total Package Interview
                            </h2>
                            <p className="text-accent text-sm font-bold uppercase tracking-[0.2em] mb-8">
                                Elite Career Engineering
                            </p>

                            <p className="text-white/70 leading-relaxed mb-8 text-lg">
                                A specialized product designed to deconstruct the interview process. Leveraging advanced AI analysis, this tool provides roleplay scenarios, resume optimization, and real-time feedback to transform candidates into top-tier prospects.
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>AI Roleplay:</strong> Realistic mock interviews</span>
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Resume Logic:</strong> Automated keyword & structural analysis</span>
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Feedback Loop:</strong> Actionable scoring & critique</span>
                                </li>
                            </ul>

                            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:border-accent hover:text-accent transition-colors">
                                Inquire About Access <ArrowRight size={16} />
                            </Link>
                        </div>

                        {/* Visual Side */}
                        <div className="relative lg:col-span-5">
                            <div className="aspect-square lg:aspect-video bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative backdrop-blur-sm group-hover:border-accent/30 transition-colors flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50" />
                                <div className="text-center relative z-10 p-8">
                                    <div className="text-9xl font-black text-white/10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">TPI</div>
                                    <ShieldCheck size={64} className="text-white mx-auto mb-6" />
                                    <div className="text-xs font-mono text-accent uppercase tracking-widest">
                                        System: Active
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* PRODUCT 3: AI ADVANTAGE */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32 group"
                    >
                        {/* Visual Side */}
                        <div className="relative order-2 lg:order-1 lg:col-span-5">
                            <div className="aspect-square lg:aspect-video bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative backdrop-blur-sm group-hover:border-accent/30 transition-colors flex items-center justify-center">
                                {/* Abstract Visualization */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 opacity-50" />
                                <div className="text-center relative z-10 p-8">
                                    <div className="w-48 h-64 border border-white/20 bg-white/5 mx-auto mb-6 flex items-center justify-center rounded-r-xl shadow-2xl relative">
                                        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                                        <BookOpen size={48} className="text-accent" />
                                    </div>
                                    <div className="absolute -bottom-4 right-12 bg-accent text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">
                                        Best Seller
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="order-1 lg:order-2 lg:col-span-7">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
                                AI Advantage
                            </h2>
                            <p className="text-accent text-sm font-bold uppercase tracking-[0.2em] mb-8">
                                The Small Business Blueprint
                            </p>

                            <p className="text-white/70 leading-relaxed mb-8 text-lg">
                                A definitive guide designed to demystify artificial intelligence for enterprise growth. This comprehensive framework includes readiness assessments, a 4-phase implementation strategy, and real-world case studies to transform your business operations.
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Strategic Framework:</strong> 4-phase implementation roadmap</span>
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Actionable Tools:</strong> Readiness assessment & ROI calculators</span>
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    <span><strong>Complete Workbook:</strong> Step-by-step pilot project planner</span>
                                </li>
                            </ul>

                            <div className="flex flex-wrap gap-4">
                                <a href="https://a.co/d/6oCHAhs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-accent transition-colors">
                                    Buy on Amazon <ArrowRight size={16} />
                                </a>
                                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:border-accent hover:text-accent transition-colors">
                                    Contact for Bulk <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>

            <Footer />
        </main>
    )
}
