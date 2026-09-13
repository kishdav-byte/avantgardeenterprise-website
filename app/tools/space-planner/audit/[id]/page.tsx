"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { SpacePlannerHeader } from "@/components/space-planner/SpacePlannerHeader"
import { motion } from "framer-motion"
import {
    Sparkles,
    CheckCircle2,
    Circle,
    ArrowRight,
    ArrowLeft,
    Clock,
    ShoppingBag,
    Printer,
    ExternalLink,
    AlertTriangle,
    Layers,
    Home,
    GraduationCap,
    Building2,
    Share2,
    Check,
    Loader2,
    Maximize2,
    X,
} from "lucide-react"
import type {
    SpaceAudit,
    SpaceAuditResult,
    OrganizationPhase,
    PhasedStep,
    AmazonProductRecommendation,
} from "@/lib/space-planner-types"

export default function SpacePlannerAuditResultPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = use(params)
    const auditId = resolvedParams.id

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [audit, setAudit] = useState<SpaceAudit | null>(null)
    const [results, setResults] = useState<SpaceAuditResult | null>(null)

    // Interactive step completion tracking
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})

    // Lightbox modal for visual mockup
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAudit() {
            try {
                const res = await fetch(`/api/space-planner/audit/${auditId}`)
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}))
                    throw new Error(errData.error || "Failed to load audit results")
                }

                const data = await res.json()
                setAudit(data.audit)
                setResults(data.results)
            } catch (err: any) {
                console.error("Error fetching audit:", err)
                setError(err.message || "An unexpected error occurred.")
            } finally {
                setLoading(false)
            }
        }

        fetchAudit()
    }, [auditId])

    function toggleStep(phaseNum: number, stepNum: number) {
        const key = `${phaseNum}-${stepNum}`
        setCompletedSteps((prev) => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="pt-32 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 animate-pulse">
                        <Sparkles size={32} />
                    </div>
                    <p className="text-white font-bold text-sm uppercase tracking-widest">
                        Loading Transformation Plan...
                    </p>
                    <p className="text-white/40 text-xs mt-1">Retrieving AI outputs & visual mockup</p>
                </div>
                <Footer />
            </main>
        )
    }

    if (error || !audit) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="pt-32 pb-24 container mx-auto px-4 max-w-xl text-center">
                    <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 space-y-4">
                        <AlertTriangle size={36} className="mx-auto" />
                        <h2 className="text-lg font-black uppercase tracking-tight text-white">
                            Unable to Load Space Plan
                        </h2>
                        <p className="text-xs text-white/60 leading-relaxed">{error || "Audit not found."}</p>
                        <Link
                            href="/tools/space-planner"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold uppercase text-xs tracking-wider"
                        >
                            <ArrowLeft size={14} /> Back to SpaceIQ
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    const phases = (results?.phased_steps || results?.phases || []) as OrganizationPhase[]
    const products = (results?.product_recommendations || []) as AmazonProductRecommendation[]

    // Compute progress stats
    let totalStepsCount = 0
    phases.forEach((p) => {
        totalStepsCount += p.steps?.length || 0
    })

    const completedCount = Object.values(completedSteps).filter(Boolean).length
    const progressPercent = totalStepsCount > 0 ? Math.round((completedCount / totalStepsCount) * 100) : 0

    // Compute total estimated hardware cost
    const totalEstimatedCost = products.reduce((sum, p) => sum + (p.price_estimate || p.estimated_price_usd || 0), 0)

    // Total estimated duration in minutes
    const totalMinutes = phases.reduce((sum, p) => sum + (p.time_estimate_minutes || p.estimated_duration_minutes || 0), 0)
    const hours = Math.floor(totalMinutes / 60)
    const remainingMins = totalMinutes % 60

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24">
                <SpacePlannerHeader backHref="/tools/space-planner" backLabel="Overview" />

                <div className="container mx-auto px-4 max-w-6xl py-10">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
                                    {audit.space_context === "home" ? (
                                        <Home size={12} />
                                    ) : audit.space_context === "classroom" ? (
                                        <GraduationCap size={12} />
                                    ) : (
                                        <Building2 size={12} />
                                    )}
                                    {audit.space_context} Track
                                </span>
                                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                                    • {audit.room_type.replace(/_/g, " ")}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                                {audit.title || `${audit.room_type.replace(/_/g, " ")} Transformation`}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                            >
                                <Printer size={14} />
                                <span className="hidden sm:inline">Print Plan</span>
                            </button>
                            <Link
                                href="/tools/space-planner/new"
                                className="px-5 py-2.5 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center gap-2 shadow-lg"
                            >
                                <Sparkles size={14} />
                                <span>Audit Another Room</span>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Metric Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                Estimated Time
                            </span>
                            <div className="text-xl font-black text-white flex items-center gap-2">
                                <Clock size={16} className="text-accent" />
                                <span>
                                    {hours > 0 ? `${hours}h ` : ""}
                                    {remainingMins}m
                                </span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                Action Phases
                            </span>
                            <div className="text-xl font-black text-white flex items-center gap-2">
                                <Layers size={16} className="text-accent" />
                                <span>{phases.length} Phases</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                Hardware Kit Total
                            </span>
                            <div className="text-xl font-black text-emerald-400">
                                ${totalEstimatedCost.toFixed(2)}
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                Checklist Progress
                            </span>
                            <div className="text-xl font-black text-accent">
                                {progressPercent}% <span className="text-xs text-white/40 font-normal">done</span>
                            </div>
                        </div>
                    </div>

                    {/* Executive Summary Card */}
                    {results?.executive_summary && (
                        <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 relative overflow-hidden">
                            <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest mb-3">
                                <Sparkles size={16} /> Strategic Assessment
                            </div>
                            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 font-medium">
                                {results.executive_summary}
                            </p>

                            {results.key_pain_points && results.key_pain_points.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">
                                        Identified Bottlenecks & Hazards
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {results.key_pain_points.map((point, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium flex items-center gap-1.5"
                                            >
                                                <AlertTriangle size={12} className="text-red-400 shrink-0" />
                                                {point}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Visual Mockup & Before Photos Section */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                                <Sparkles className="text-accent" size={20} /> Visual Transformation Blueprint
                            </h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                                AI Photorealistic Synthesis
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* "After" Concept (Hero Visual) */}
                            <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] relative group">
                                {results?.visual_mockup_url ? (
                                    <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={results.visual_mockup_url}
                                            alt="Visual concept after organization"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <button
                                            onClick={() => setLightboxImage(results.visual_mockup_url!)}
                                            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 text-white hover:text-accent hover:bg-black transition-all"
                                        >
                                            <Maximize2 size={16} />
                                        </button>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="px-3 py-1 rounded-full bg-accent text-black font-black uppercase text-[10px] tracking-widest shadow-lg">
                                                Concept After Mockup
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-white/[0.01]">
                                        <Sparkles size={36} className="text-accent mb-3 opacity-50" />
                                        <h4 className="text-sm font-bold uppercase tracking-tight text-white mb-1">
                                            Visual Architectural Concept Prompt
                                        </h4>
                                        <p className="text-xs text-white/60 max-w-md leading-relaxed italic">
                                            &ldquo;{results?.visual_mockup_prompt || "Photorealistic interior space with optimal storage density and ergonomic lighting."}&rdquo;
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* "Before" Clutter Photo Thumbnails */}
                            <div className="lg:col-span-4 flex flex-col gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">
                                    Original Space Photos ({audit.clutter_photos?.length || 0})
                                </span>
                                {audit.clutter_photos && audit.clutter_photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 flex-grow">
                                        {audit.clutter_photos.slice(0, 4).map((photoUrl, pIdx) => (
                                            <button
                                                key={pIdx}
                                                type="button"
                                                onClick={() => setLightboxImage(photoUrl)}
                                                className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-black/40 text-left"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={photoUrl}
                                                    alt={`Before angle ${pIdx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute bottom-2 left-2">
                                                    <span className="px-2 py-0.5 rounded bg-black/80 text-white/80 text-[9px] font-bold uppercase">
                                                        Before #{pIdx + 1}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/40 flex-grow flex items-center justify-center">
                                        No initial photos uploaded
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Phased Action Roadmap (Interactive Checklist) */}
                    <div className="mb-14">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                                    <CheckCircle2 className="text-accent" size={20} /> Phased Action Steps
                                </h2>
                                <p className="text-xs text-white/50 mt-0.5">
                                    Follow each zone sequentially. Check off items as you complete them.
                                </p>
                            </div>
                            <div className="text-xs font-bold text-white/70">
                                {completedCount} of {totalStepsCount} completed
                            </div>
                        </div>

                        <div className="space-y-6">
                            {phases.map((phase) => (
                                <div
                                    key={phase.phase_number}
                                    className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm"
                                >
                                    {/* Phase Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-accent text-black font-black text-xs flex items-center justify-center shrink-0">
                                                {phase.phase_number}
                                            </span>
                                            <div>
                                                <h3 className="text-base font-bold uppercase tracking-tight text-white">
                                                    {phase.title || phase.phase_title || `Phase ${phase.phase_number}`}
                                                </h3>
                                                <p className="text-xs text-white/50 mt-0.5">{phase.description || phase.phase_objective}</p>
                                            </div>
                                        </div>
                                        {(phase.time_estimate_minutes || phase.estimated_duration_minutes) && (
                                            <div className="inline-flex items-center gap-1.5 text-xs text-white/40 font-semibold">
                                                <Clock size={13} className="text-accent" />
                                                <span>~{phase.time_estimate_minutes || phase.estimated_duration_minutes} minutes</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Steps Checklist */}
                                    <div className="space-y-3">
                                        {phase.steps?.map((step: PhasedStep) => {
                                            const stepKey = `${phase.phase_number}-${step.step_number}`
                                            const isDone = Boolean(completedSteps[stepKey])

                                            return (
                                                <button
                                                    key={step.step_number}
                                                    type="button"
                                                    onClick={() => toggleStep(phase.phase_number, step.step_number)}
                                                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${isDone
                                                            ? "bg-emerald-500/5 border-emerald-500/30 opacity-70"
                                                            : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${isDone
                                                            ? "bg-emerald-500 border-emerald-500 text-black"
                                                            : "border-white/30 text-transparent"
                                                        }`}>
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>

                                                    <div className="flex-grow">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            {step.zone && (
                                                                <span className="px-2 py-0.5 rounded bg-white/10 text-accent text-[9px] font-black uppercase tracking-wider">
                                                                    Zone: {step.zone}
                                                                </span>
                                                            )}
                                                            <span className={`text-xs font-bold text-white ${isDone ? "line-through text-white/50" : ""}`}>
                                                                Step {step.step_number}: {step.action}
                                                            </span>
                                                        </div>
                                                        {step.tips && (
                                                            <p className="text-[11px] text-white/50 leading-relaxed mt-1">
                                                                <strong className="text-white/70">Pro Tip:</strong> {step.tips}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Amazon Affiliate Shopping Kit */}
                    {products.length > 0 && (
                        <div className="mb-14">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                                        <ShoppingBag className="text-accent" size={20} /> Curated Amazon Shopping Kit
                                    </h2>
                                    <p className="text-xs text-white/50 mt-0.5">
                                        Tailored organizers & hardware matching your budget tier with affiliate checkout links.
                                    </p>
                                </div>
                                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                                    Affiliate Tag: avantgarde-20
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {products.map((item, idx) => {
                                    const price = item.price_estimate || item.estimated_price_usd || 24.99
                                    const priority = item.priority || "recommended"

                                    return (
                                        <div
                                            key={idx}
                                            className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-accent/40 transition-all duration-300 flex flex-col justify-between group"
                                        >
                                            <div>
                                                {/* Header Badges */}
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${priority === "must_have"
                                                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                                            : priority === "recommended"
                                                                ? "bg-accent/15 text-accent border border-accent/30"
                                                                : "bg-white/10 text-white/60"
                                                        }`}>
                                                        {priority.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-base font-black text-white">
                                                        ${price.toFixed(2)}
                                                    </span>
                                                </div>

                                                <h4 className="text-sm font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-accent transition-colors">
                                                    {item.title}
                                                </h4>

                                                {item.placement_zone && (
                                                    <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-2">
                                                        Zone: {item.placement_zone}
                                                    </div>
                                                )}

                                                <p className="text-xs text-white/50 leading-relaxed mb-6">
                                                    {item.reasoning || item.rationale || "Engineered to maximize storage accessibility and eliminate clutter buildup."}
                                                </p>
                                            </div>

                                            <a
                                                href={item.affiliate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-accent text-white hover:text-black font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                                            >
                                                <span>View on Amazon</span>
                                                <ExternalLink size={13} />
                                            </a>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bottom Toolbar */}
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <h4 className="text-sm font-bold uppercase tracking-tight text-white">
                                Ready to transform another room?
                            </h4>
                            <p className="text-xs text-white/50 mt-0.5">
                                Run a comprehensive audit for your closet, garage, office, or classroom.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/tools/space-planner"
                                className="px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold uppercase text-xs tracking-wider"
                            >
                                Tool Hub
                            </Link>
                            <Link
                                href="/tools/space-planner/new"
                                className="px-6 py-3 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center gap-2"
                            >
                                <Sparkles size={14} />
                                <span>Start New Audit</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <X size={20} />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxImage}
                        alt="Zoomed preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl"
                    />
                </div>
            )}

            <Footer />
        </main>
    )
}
