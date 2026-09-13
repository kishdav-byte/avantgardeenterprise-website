"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import Link from "next/link"
import { LayoutGrid, Home, GraduationCap, Building2, CheckCircle2, Sparkles, ArrowRight, ArrowLeft, Layers, Image as ImageIcon, ShoppingBag } from "lucide-react"
import { PricingCards } from "@/components/space-planner/PricingCards"
import { FeatureComparison } from "@/components/space-planner/FeatureComparison"

export default function SpacePlannerPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-40 pb-16 px-4 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 blur-[140px] pointer-events-none rounded-full" />

                <div className="container mx-auto max-w-5xl relative z-10">
                    {/* Breadcrumb / Back */}
                    <div className="mb-8">
                        <Link
                            href="/services"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-accent transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to Services
                        </Link>
                    </div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest mb-6">
                            <Sparkles size={14} /> Phase 2 Engine & Conversion Active
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
                            SpacePlan <span className="text-accent">AI</span>
                        </h1>
                        <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            Multimodal AI space organization planner engineered for precision decluttering, photorealistic visual mockups, and curated shopping roadmaps across home, educational, and commercial spaces.
                        </p>
                    </motion.div>

                    {/* Context Tracks (Home, Classroom, Business) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                                <Home size={24} />
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Home Spaces</h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-4">
                                Living rooms, pantries, closets, garages, and bedrooms. Tailored to family size, pet needs, and daily maintenance routines.
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400/80 bg-blue-500/10 px-2.5 py-1 rounded-full">
                                Home Track
                            </span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
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
                                Retail floors, stockrooms, commercial offices, and kitchens. Built around foot traffic, OSHA/health code compliance, and turnover.
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                Enterprise Track
                            </span>
                        </motion.div>
                    </div>

                    {/* Multimodal Outputs Grid */}
                    <div className="mb-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <Layers className="text-accent" size={24} /> Multimodal Intelligence Output
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                                    <CheckCircle2 size={16} className="text-accent" /> Phased Action Steps
                                </div>
                                <p className="text-white/50 text-xs leading-relaxed">
                                    Timed, sequential decluttering steps broken into zones with practical sorting rules and ergonomic best practices.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                                    <ImageIcon size={16} className="text-accent" /> Visual Concept Mockup
                                </div>
                                <p className="text-white/50 text-xs leading-relaxed">
                                    Photorealistic visual synthesis showing the transformed space with optimal storage density and lighting.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
                                    <ShoppingBag size={16} className="text-accent" /> Amazon Affiliate Kits
                                </div>
                                <p className="text-white/50 text-xs leading-relaxed">
                                    Itemized shopping lists prioritized by necessity with estimated pricing and direct affiliate checkout links.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Comparison Matrix */}
            <FeatureComparison />

            {/* Pricing & Credit Packs */}
            <PricingCards />

            <Footer />
        </main>
    )
}
