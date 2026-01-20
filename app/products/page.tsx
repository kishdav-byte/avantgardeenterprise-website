"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Cpu, Globe, Mic, ShieldCheck, Zap, BookOpen, Target } from "lucide-react"
import Link from "next/link"
import { ProductShowcase } from "@/components/sections/ProductShowcase"
import { DiscoveryCTA } from "@/components/sections/DiscoveryCTA"

const tpiSlides = [
    {
        image: "/showcase/tpi-1.png",
        title: "Mission Briefing",
        description: "Analyze mission dossiers and role requirements with automated intel injection.",
        features: ["Interviewer Intel", "Role Requirements (JD)", "Mission Toolkit"]
    },
    {
        image: "/showcase/tpi-2.png",
        title: "Performance Hub",
        description: "Ready to dominate? Track market relevance and strategic fit in real-time.",
        features: ["Market Metrics", "Job Tracker", "Strategic Fit Score"]
    }
]

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
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-48 group"
                    >
                        {/* Content Side */}
                        <div className="lg:col-span-7">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 italic italic">
                                AI Command Center
                            </h2>
                            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-8">
                                The Orchestration Layer // For Digital Workforces
                            </p>

                            <div className="space-y-6 mb-10">
                                <div className="bg-white/[0.03] border-l-2 border-accent p-6 rounded-r-2xl italic italic relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                        <Bot size={64} />
                                    </div>
                                    <p className="text-white/70 text-lg leading-relaxed mb-4">
                                        "Most businesses treat AI like a chatbot. We treat it like a workforce. The Command Center is for the leader who isn't satisfied with 'good enough' and demands real-time, multi-modal coordination."
                                    </p>
                                    <p className="text-white/40 text-sm leading-relaxed uppercase tracking-tighter">
                                        Unified intelligence streams from Google Gemini and OpenAI, synchronized into a single, brand-adaptive voice interface that never sleeps.
                                    </p>
                                </div>
                            </div>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                {[
                                    { label: "Dual-Core", text: "Gemini Speed + OpenAI Nuance" },
                                    { label: "Adaptive", text: "11+ Distinct Voice Personas" },
                                    { label: "Infinite Scale", text: "Unlimited Concurrent Traffic" },
                                    { label: "Brand-Aware", text: "Custom Knowledge Base Injection" },
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 items-start p-4 bg-white/5 border border-white/5 rounded-xl">
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{item.label}</p>
                                            <p className="text-[11px] font-bold opacity-40 leading-snug uppercase tracking-tight">{item.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/contact" className="relative group overflow-hidden px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-accent transition-colors inline-flex items-center gap-2">
                                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10 group-hover:text-black">Request Enterprise Access</span>
                                <ArrowRight size={18} className="relative z-10" />
                            </Link>
                        </div>

                        {/* Visual Side - Carousel */}
                        <div className="relative lg:col-span-5">
                            <div className="relative group">
                                <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-accent/10 blur-[60px] opacity-20" />
                                <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-accent/30">
                                    <ProductShowcase />
                                </div>
                                <div className="absolute -top-4 -right-4 bg-black border border-accent/30 px-4 py-1 text-[8px] font-black uppercase tracking-widest text-accent">
                                    Systems Interface // Active
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* PRODUCT 2: TOTAL PACKAGE INTERVIEW */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-48 group"
                    >
                        {/* Visual Side - NOW CAROUSEL */}
                        <div className="relative lg:col-span-5 order-2 lg:order-1">
                            <div className="relative group">
                                <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-accent/10 blur-[60px] opacity-20" />
                                <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-accent/30">
                                    <ProductShowcase slides={tpiSlides} />
                                </div>
                                <div className="absolute -top-4 -right-4 bg-black border border-accent/30 px-4 py-1 text-[8px] font-black uppercase tracking-widest text-accent">
                                    Protocol TPI-01 // ACTIVE
                                </div>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="order-1 lg:order-2 lg:col-span-7">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 italic italic">
                                Total Package <br /> Interview
                            </h2>
                            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-8">
                                Elite Career Engineering // Modular Protocol
                            </p>

                            <div className="space-y-6 mb-10">
                                <div className="bg-white/[0.03] border-l-2 border-accent p-6 rounded-r-2xl italic italic relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                        <Target size={64} />
                                    </div>
                                    <p className="text-white/70 text-lg leading-relaxed mb-4">
                                        "The market doesn't pay for potential; it pays for proof. We built the Interview Coach to strip away the guesswork and replace it with peak-performance simulation."
                                    </p>
                                    <p className="text-white/40 text-sm leading-relaxed">
                                        A multi-layered system designed to optimize every touchpoint of your professional presentation—from resume logic to the final handshake.
                                    </p>
                                </div>
                            </div>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                {[
                                    { label: "AI Roleplay", text: "Cinematic Peer-to-Peer Mock Scenarios" },
                                    { label: "Resume Logic", text: "Automated Path-to-Impact Analysis" },
                                    { label: "Kill Switch", text: "Red-Flag Detection & Neutralization" },
                                    { label: "ROI Roadmap", text: "Personalized Salary Leverage Guide" },
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 items-start p-4 bg-white/5 border border-white/5 rounded-xl">
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{item.label}</p>
                                            <p className="text-[11px] font-bold opacity-40 leading-snug uppercase tracking-tight">{item.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <button className="relative group overflow-hidden px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-accent transition-colors flex items-center gap-2">
                                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10 group-hover:text-black">Inquire About Access</span>
                                <ArrowRight size={18} className="relative z-10" />
                            </button>
                        </div>
                    </motion.div>

                    {/* PRODUCT 3: AI ADVANTAGE */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-32 group"
                    >
                        {/* Visual Side - Book Cover */}
                        <div className="relative order-2 lg:order-1 lg:col-span-5">
                            <div className="relative aspect-[2/3] max-w-sm mx-auto group">
                                {/* Glow Effect */}
                                <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-accent/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className="relative h-full w-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1">
                                    <img
                                        src="/ai-advantage-cover.png"
                                        alt="The AI Advantage for Small Business Book Cover"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Glass Overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-accent text-black text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-xl z-20 whitespace-nowrap">
                                    Amazon #1 Release
                                </div>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="order-1 lg:order-2 lg:col-span-7">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 italic italic">
                                AI Advantage
                            </h2>
                            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-8">
                                The Small Business Blueprint // By David Kish
                            </p>

                            <div className="space-y-6 mb-10">
                                <div className="bg-white/[0.03] border-l-2 border-accent p-6 rounded-r-2xl italic italic relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                        <BookOpen size={64} />
                                    </div>
                                    <p className="text-white/70 text-lg leading-relaxed mb-4">
                                        "If you picked up this book, it's very likely that you are exhausted. You're probably wearing more hats than any reasonable person should—CEO, accountant, customer service rep, and marketing director."
                                    </p>
                                    <p className="text-white/40 text-sm leading-relaxed">
                                        Andrew owned a pizzeria. He was passionate about his craft but drowning in manual processes. He was working 16-hour days but still flying blind. This book is the story of how that's changing for every small business owner.
                                    </p>
                                </div>

                                <p className="text-white/60 leading-relaxed text-sm uppercase tracking-widest font-bold">
                                    Embracing AI isn't about replacing your human touch—it's about amplifying it. It's about getting back the time and energy you need to focus on what truly matters.
                                </p>
                            </div>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                {[
                                    { label: "Strategic roadmap", text: "A 4-phase implementation plan" },
                                    { label: "Leveling the Field", text: "Tools that compete with giants" },
                                    { label: "ROI Calculators", text: "Hard data for every investment" },
                                    { label: "The Workbook", text: "Integrated interactive portal" },
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 items-start p-4 bg-white/5 border border-white/5 rounded-xl">
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{item.label}</p>
                                            <p className="text-[11px] font-bold opacity-40 leading-snug uppercase tracking-tight">{item.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-wrap gap-4">
                                <a href="https://a.co/d/6oCHAhs" target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-accent transition-colors flex items-center gap-2">
                                    <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <span className="relative z-10 group-hover:text-black">Buy on Amazon</span>
                                    <ArrowRight size={18} className="relative z-10" />
                                </a>
                                <Link
                                    href="/dashboard/workbook"
                                    className="px-10 py-5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:border-accent hover:text-accent transition-all flex items-center gap-2"
                                >
                                    Access Interactive Workbook
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    <div className="mb-32">
                        <DiscoveryCTA />
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    )
}
