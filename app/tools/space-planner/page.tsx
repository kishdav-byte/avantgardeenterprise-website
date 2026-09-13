"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import Link from "next/link"
import {
    LayoutGrid,
    Home,
    GraduationCap,
    Building2,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    ChevronDown,
} from "lucide-react"
import { PricingCards } from "@/components/space-planner/PricingCards"
import { FeatureComparison } from "@/components/space-planner/FeatureComparison"
import { SpacePlannerHeader } from "@/components/space-planner/SpacePlannerHeader"
import { QuickMicroAuditBox } from "@/components/space-planner/QuickMicroAuditBox"
import type { CreditStatus } from "@/lib/space-planner-types"

export default function SpacePlannerPage() {
    const [credits, setCredits] = useState<CreditStatus | null>(null)

    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch("/api/space-planner/credits")
                if (res.ok) {
                    const data = await res.json()
                    setCredits(data)
                }
            } catch (e) {
                console.error("Failed to load status:", e)
            }
        }
        checkStatus()
    }, [])

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24">
                <SpacePlannerHeader backHref="/services" backLabel="Services" />

                <section className="pt-12 pb-16 px-4 relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-accent/10 blur-[150px] pointer-events-none rounded-full" />

                    <div className="container mx-auto max-w-5xl relative z-10">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            {/* Admin Pass Badge (if logged in as admin) */}
                            {credits?.isAdmin ? (
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                                    <ShieldCheck size={16} className="text-amber-400" />
                                    <span>Admin Pass Active • Unlimited Bypasses Enabled</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest mb-6">
                                    <Sparkles size={14} /> Multimodal Room Planner Active
                                </div>
                            )}

                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
                                Space<span className="text-accent">IQ</span>
                            </h1>
                            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                                Multimodal AI space organization planner engineered for precision decluttering, photorealistic visual mockups, and curated shopping roadmaps across home, educational, and commercial spaces.
                            </p>

                            {/* Direct Quick-Action Links */}
                            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                                <a
                                    href="#quick-micro-audit"
                                    className="px-6 py-3 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center gap-2 shadow-xl shadow-accent/20"
                                >
                                    <Sparkles size={14} />
                                    <span>Try Free Drawer Audit (No Sign-Up)</span>
                                    <ChevronDown size={14} />
                                </a>
                                <Link
                                    href="/tools/space-planner/new"
                                    className="px-6 py-3 rounded-xl border border-white/20 hover:border-white/40 text-white font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2"
                                >
                                    <span>Full Room Wizard</span>
                                    <ArrowRight size={14} />
                                </Link>
                                <a
                                    href="#pricing"
                                    className="px-5 py-3 rounded-xl border border-white/10 hover:border-white/25 text-white/70 font-semibold uppercase text-xs tracking-wider transition-all"
                                >
                                    Credit Packs
                                </a>
                            </div>
                        </motion.div>

                        {/* Interactive Hero Quick Micro-Audit Box */}
                        <motion.div
                            id="quick-micro-audit"
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mb-16 scroll-mt-28"
                        >
                            <QuickMicroAuditBox
                                isAdmin={credits?.isAdmin}
                                guestLimitReached={credits?.guestLimitReached}
                            />
                        </motion.div>

                        {/* Context Tracks (Home, Classroom, Business) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                                    <Home size={24} />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Home Spaces</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-4">
                                    Living rooms, home offices, pantries, closets, garages, and bedrooms. Tailored to family size, pet needs, and daily maintenance routines.
                                </p>
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400/80 bg-blue-500/10 px-2.5 py-1 rounded-full">
                                    Home Track
                                </span>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                                    <GraduationCap size={24} />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Classroom Spaces</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-4">
                                    Elementary classrooms, STEM labs, sensory corners, and lounges. Optimized for student headcount, accessibility, and rotations.
                                </p>
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                    Education Track
                                </span>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Business Spaces</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-4">
                                    Commercial offices, executive home offices, retail floors, stockrooms, and kitchens. Built around foot traffic, OSHA/health code compliance, and turnover.
                                </p>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                    Enterprise Track
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Capability Comparison Table */}
                <FeatureComparison />

                {/* Credit Packages & Pricing */}
                <PricingCards />
            </div>
            <Footer />
        </main>
    )
}
