"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles,
    UploadCloud,
    Loader2,
    Check,
    ArrowRight,
    AlertCircle,
    X,
    Lock,
    Zap,
} from "lucide-react"
import { uploadSpacePlannerPhoto } from "@/lib/space-planner-upload"
import { getClientFingerprint } from "@/lib/space-planner-fingerprint-client"
import Link from "next/link"

interface MicroSpaceOption {
    id: string
    label: string
    desc: string
}

const MICRO_SPACES: MicroSpaceOption[] = [
    { id: "junk_drawer", label: "Junk / Utility Drawer", desc: "Cutlery, gadgets, cords & odds" },
    { id: "desk_surface", label: "Work Desk / Vanity", desc: "Monitors, papers, makeup & pens" },
    { id: "medicine_cabinet", label: "Cabinet / Pantry Shelf", desc: "Spices, medicines & canisters" },
    { id: "under_sink", label: "Under-Sink Cabinet", desc: "Cleaning sprays, soaps & bins" },
]

export function QuickMicroAuditBox({
    isAdmin = false,
    guestLimitReached = false,
}: {
    isAdmin?: boolean
    guestLimitReached?: boolean
}) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedSpace, setSelectedSpace] = useState<string>("junk_drawer")
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string>("")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [sampleUsed, setSampleUsed] = useState(guestLimitReached)

    useEffect(() => {
        setSampleUsed(guestLimitReached)
    }, [guestLimitReached])

    function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        const selected = e.target.files[0]
        setFile(selected)
        setErrorMessage(null)

        const objectUrl = URL.createObjectURL(selected)
        setPreviewUrl(objectUrl)
    }

    function handleClearPhoto() {
        setFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setErrorMessage(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    async function handleRunMicroAudit() {
        if (!file) {
            setErrorMessage("Please upload or drop a photo of your messy drawer or space.")
            return
        }

        setErrorMessage(null)
        setIsUploading(true)
        setStatusMessage("Compressing & securing clutter photo...")

        try {
            const fp = getClientFingerprint()

            // 1. Upload compressed photo
            const uploadedUrl = await uploadSpacePlannerPhoto(file)

            setIsUploading(false)
            setIsAnalyzing(true)
            setStatusMessage("AI Vision analyzing clutter geometry & formulating blueprint...")

            // 2. Call analyze API route
            const res = await fetch("/api/space-planner/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-space-planner-fingerprint": fp,
                },
                body: JSON.stringify({
                    spaceContext: "home",
                    roomType: selectedSpace,
                    title: `Micro-Audit: ${MICRO_SPACES.find((s) => s.id === selectedSpace)?.label || "Small Space"}`,
                    goals: ["organize_categorize", "minimize_declutter"],
                    budgetTier: "diy_low",
                    isMicroAudit: true,
                    lifestyleMetrics: {
                        primary_usage: "Micro-space organization",
                        maintenance_time_preference: "ultra_low_5min",
                    },
                    clutterPhotoUrls: [uploadedUrl],
                }),
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                if (data.code === "GUEST_LIMIT_REACHED") {
                    setSampleUsed(true)
                    throw new Error("You have already used your 1 free micro-audit sample. Sign in to continue.")
                }
                throw new Error(data.error || "Failed to generate micro-audit plan.")
            }

            // Redirect immediately to results dashboard
            router.push(`/tools/space-planner/audit/${data.audit.id}`)
        } catch (err: any) {
            setIsUploading(false)
            setIsAnalyzing(false)
            setErrorMessage(err.message || "An unexpected error occurred.")
        }
    }

    if (sampleUsed && !isAdmin) {
        return (
            <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white/[0.02] border border-accent/20 backdrop-blur-xl text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto">
                    <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                    Free Micro-Audit Sample Consumed
                </h3>
                <p className="text-white/60 text-xs leading-relaxed max-w-md mx-auto">
                    You have already redeemed your 1 complimentary guest sample. Sign in or create a free account to permanently save your transformation blueprints and unlock full multi-room audits.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/login?redirect=/tools/space-planner"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Sign In or Sign Up</span>
                        <ArrowRight size={14} />
                    </Link>
                    <a
                        href="#pricing"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-white/80 hover:text-white font-bold uppercase text-xs tracking-wider transition-all"
                    >
                        View Credit Packs
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Header / Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <Sparkles size={11} /> 100% Free Sample • Zero Sign-Up Required
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">
                        Try an Instant Micro-Audit
                    </h3>
                </div>
                <span className="text-[11px] text-white/40 font-semibold">
                    Instant AI Blueprint in &lt; 30s
                </span>
            </div>

            {/* Step 1: Select Small Space */}
            <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2.5">
                    1. Select Target Small Space
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MICRO_SPACES.map((space) => {
                        const isSelected = selectedSpace === space.id
                        return (
                            <button
                                key={space.id}
                                type="button"
                                onClick={() => setSelectedSpace(space.id)}
                                disabled={isUploading || isAnalyzing}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                        ? "bg-accent/15 border-accent text-white shadow-md shadow-accent/10"
                                        : "bg-white/[0.02] border-white/5 text-white/60 hover:border-white/20 hover:text-white"
                                }`}
                            >
                                <div className="text-xs font-bold truncate">{space.label}</div>
                                <div className="text-[9px] text-white/40 truncate mt-0.5">{space.desc}</div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Step 2: Upload Clutter Photo */}
            <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2.5">
                    2. Snap or Drop Clutter Photo
                </label>

                {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-accent/40 bg-black/40 p-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={previewUrl}
                                alt="Clutter preview"
                                className="w-16 h-16 object-cover rounded-xl border border-white/10"
                            />
                            <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Check size={14} className="text-emerald-400" />
                                    <span>Photo Attached</span>
                                </div>
                                <div className="text-[10px] text-white/40 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                                    {file?.name}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearPhoto}
                            disabled={isUploading || isAnalyzing}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all mr-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/15 hover:border-accent/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.03] group"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic"
                            onChange={handleFileSelected}
                            className="hidden"
                        />
                        <div className="w-10 h-10 rounded-xl bg-white/5 text-white/60 group-hover:text-accent group-hover:scale-110 flex items-center justify-center mx-auto mb-2 transition-all">
                            <UploadCloud size={20} />
                        </div>
                        <p className="text-xs font-bold text-white group-hover:text-accent transition-colors">
                            Click to upload or drag & drop photo of clutter
                        </p>
                        <p className="text-[10px] text-white/40 mt-1">
                            JPG, PNG, or WEBP up to 12MB • Canvas auto-compressed
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <Lock size={12} className="text-white/30" />
                    <span>Private • Photos never shared or sold</span>
                </div>

                <button
                    type="button"
                    onClick={handleRunMicroAudit}
                    disabled={!file || isUploading || isAnalyzing}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                    {isUploading || isAnalyzing ? (
                        <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>{statusMessage || "Analyzing..."}</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={15} />
                            <span>Run Free Micro-Audit</span>
                            <ArrowRight size={13} />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
