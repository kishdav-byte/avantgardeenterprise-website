"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Home,
    GraduationCap,
    Building2,
    UploadCloud,
    Check,
    ArrowRight,
    ArrowLeft,
    Trash2,
    Sparkles,
    Loader2,
    Layers,
    DollarSign,
    Zap,
    AlertCircle,
    Info,
    ImageIcon,
} from "lucide-react"
import { uploadSpacePlannerPhoto } from "@/lib/space-planner-upload"
import { PricingCards } from "@/components/space-planner/PricingCards"
import {
    SpaceContext,
    RoomType,
    OrganizationGoal,
    BudgetTier,
    HomeLifestyleMetrics,
    ClassroomLifestyleMetrics,
    BusinessLifestyleMetrics,
} from "@/lib/space-planner-types"

const HOME_ROOMS: { id: RoomType; label: string }[] = [
    { id: "kitchen_pantry", label: "Kitchen & Pantry" },
    { id: "living_room", label: "Living Room" },
    { id: "closet_walk_in", label: "Walk-in Closet" },
    { id: "closet_reach_in", label: "Reach-in Closet" },
    { id: "primary_bedroom", label: "Primary Bedroom" },
    { id: "kids_bedroom", label: "Kids' Bedroom" },
    { id: "garage", label: "Garage & Workshop" },
    { id: "home_office", label: "Home Office" },
    { id: "playroom", label: "Playroom / Rec Room" },
    { id: "laundry_mudroom", label: "Laundry & Mudroom" },
    { id: "bathroom", label: "Bathroom & Linen" },
    { id: "attic_basement", label: "Attic & Basement" },
]

const CLASSROOM_ROOMS: { id: RoomType; label: string }[] = [
    { id: "elementary_general", label: "Elementary Classroom" },
    { id: "preschool_kindergarten", label: "Pre-K / Kindergarten" },
    { id: "stem_science_lab", label: "STEM & Science Lab" },
    { id: "reading_nook_library", label: "Classroom Library & Nook" },
    { id: "art_studio", label: "Art Studio & Supplies" },
    { id: "special_ed_sensory", label: "Sensory & Inclusion Room" },
    { id: "teacher_lounge_prep", label: "Teacher Prep & Lounge" },
    { id: "classroom_supply_closet", label: "Supply Closet & Storage" },
    { id: "makerspace", label: "Makerspace & Activity Center" },
]

const BUSINESS_ROOMS: { id: RoomType; label: string }[] = [
    { id: "retail_sales_floor", label: "Retail Sales Floor" },
    { id: "warehouse_fulfillment", label: "Warehouse & Packing Station" },
    { id: "commercial_office", label: "Commercial Office Suite" },
    { id: "breakroom_kitchen", label: "Staff Breakroom & Pantry" },
    { id: "restaurant_kitchen_pantry", label: "Commercial Kitchen Dry Storage" },
    { id: "conference_meeting_room", label: "Conference & Meeting Room" },
    { id: "clinic_treatment_room", label: "Clinic / Treatment Room" },
    { id: "supply_storage_room", label: "Central Supply Storage" },
    { id: "workshop_production", label: "Trades Workshop / Production" },
    { id: "reception_front_desk", label: "Reception & Waiting Area" },
]

const ALL_GOALS: { id: OrganizationGoal; label: string; desc: string }[] = [
    { id: "organize_categorize", label: "Categorize & Zone", desc: "Group like items and establish distinct home addresses" },
    { id: "minimize_declutter", label: "Aggressive Purge", desc: "Drastically eliminate obsolete clutter, duplicates, and waste" },
    { id: "aesthetic_enhancement", label: "Visual Aesthetics", desc: "Create uniform, Pinterest-worthy design harmony" },
    { id: "child_student_safety", label: "Child / Student Safety", desc: "Prevent tip hazards, secure chemicals, and lower essentials" },
    { id: "traffic_flow_ergonomics", label: "Traffic Flow & Ergonomics", desc: "Clear bottlenecks and optimize movement pathways" },
    { id: "storage_density_maximization", label: "Maximize Vertical Storage", desc: "Squeeze every square inch out of shelves and walls" },
    { id: "daily_routine_efficiency", label: "Rapid Habit Loops", desc: "Engineered for sustainable 5-minute daily resets" },
    { id: "compliance_safety_readiness", label: "Compliance & Safety Readiness", desc: "OSHA aisle clearance, fire codes, and health standards" },
    { id: "inventory_access_speed", label: "Fast SKU Picking", desc: "FIFO rotation, clear bin addresses, and instant picking" },
]

const PROCESSING_STAGES = [
    "Analyzing clutter photos & geometry...",
    "Evaluating context heuristics & spatial flow...",
    "Formulating phased action roadmap with time estimates...",
    "Synthesizing DALL-E 3 architectural 'after' concept mockup...",
    "Matching curated Amazon affiliate storage hardware...",
    "Finalizing transformation blueprint...",
]

export function AuditWizard() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)

    // Form State
    const [spaceContext, setSpaceContext] = useState<SpaceContext>("home")
    const [roomType, setRoomType] = useState<RoomType>("kitchen_pantry")
    const [roomTitle, setRoomTitle] = useState("")
    const [goals, setGoals] = useState<OrganizationGoal[]>(["organize_categorize", "minimize_declutter"])
    const [budgetTier, setBudgetTier] = useState<BudgetTier>("medium")
    const [budgetLimit, setBudgetLimit] = useState<number | undefined>(undefined)
    const [roomNotes, setRoomNotes] = useState("")

    // Photos state
    const [photos, setPhotos] = useState<{ url: string; file?: File; isUploading?: boolean }[]>([])
    const [isCompressing, setIsCompressing] = useState(false)

    // Lifestyle Metrics State
    const [homeMetrics, setHomeMetrics] = useState<HomeLifestyleMetrics>({
        family_size: 4,
        has_pets: false,
        age_groups: ["adult"],
        primary_usage: "Daily meal prep and family gathering",
        desired_aesthetic: "modern_clean",
    })

    const [classroomMetrics, setClassroomMetrics] = useState<ClassroomLifestyleMetrics>({
        student_count: 24,
        grade_level: "3rd Grade",
        subject_focus: "General",
        accessibility_needs: false,
        sensory_needs: false,
        seating_layout: "collaborative_pods",
    })

    const [businessMetrics, setBusinessMetrics] = useState<BusinessLifestyleMetrics>({
        employee_headcount: 8,
        daily_foot_traffic: "moderate_client_facing",
        compliance_requirements: ["osha_general"],
        storage_turnover_frequency: "weekly_restock",
        industry_type: "Commercial Office",
    })

    // Credits & Submission State
    const [credits, setCredits] = useState<{ hasCredit: boolean; balance: number; freeSampleAvailable: boolean } | null>(null)
    const [loadingCredits, setLoadingCredits] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [processingStageIndex, setProcessingStageIndex] = useState(0)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Auto update room type when context changes
    useEffect(() => {
        if (spaceContext === "home") setRoomType("kitchen_pantry")
        if (spaceContext === "classroom") setRoomType("elementary_general")
        if (spaceContext === "business") setRoomType("retail_sales_floor")
    }, [spaceContext])

    // Load credits on mount & when reaching Step 4
    useEffect(() => {
        async function fetchCredits() {
            setLoadingCredits(true)
            try {
                const res = await fetch("/api/space-planner/credits")
                if (res.ok) {
                    const data = await res.json()
                    setCredits({
                        hasCredit: data.hasCredit ?? false,
                        balance: data.balance ?? 0,
                        freeSampleAvailable: data.freeSampleAvailable ?? false,
                    })
                }
            } catch (err) {
                console.error("Failed to load credits:", err)
            } finally {
                setLoadingCredits(false)
            }
        }

        fetchCredits()
    }, [currentStep])

    // Photo file selection & immediate compression/upload
    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        setIsCompressing(true)

        for (const file of files) {
            try {
                // Temporarily add preview
                const tempUrl = URL.createObjectURL(file)
                const tempItem = { url: tempUrl, file, isUploading: true }
                setPhotos((prev) => [...prev, tempItem])

                // Upload through compression helper
                const uploadedUrl = await uploadSpacePlannerPhoto(file)

                // Replace temp preview with uploaded CDN URL
                setPhotos((prev) =>
                    prev.map((p) => (p.url === tempUrl ? { url: uploadedUrl, isUploading: false } : p))
                )
            } catch (err: any) {
                console.error("Upload error:", err)
                alert(`Photo upload failed: ${err.message || "Unknown error"}`)
                setPhotos((prev) => prev.filter((p) => p.file !== file))
            }
        }

        setIsCompressing(false)
        e.target.value = ""
    }

    function removePhoto(indexToRemove: number) {
        setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    }

    function toggleGoal(goalId: OrganizationGoal) {
        setGoals((prev) =>
            prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
        )
    }

    // Submission Handler
    async function handleSubmitAudit() {
        setIsSubmitting(true)
        setSubmitError(null)

        // Rotate stage ticker messages
        const tickerInterval = setInterval(() => {
            setProcessingStageIndex((prev) => (prev + 1) % PROCESSING_STAGES.length)
        }, 3200)

        try {
            // Determine active metrics payload
            const activeMetrics =
                spaceContext === "home"
                    ? homeMetrics
                    : spaceContext === "classroom"
                        ? classroomMetrics
                        : businessMetrics

            const clutterPhotoUrls = photos.map((p) => p.url)

            const res = await fetch("/api/space-planner/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    spaceContext,
                    roomType,
                    title: roomTitle.trim() || undefined,
                    goals,
                    budgetTier,
                    budgetLimit: budgetLimit || undefined,
                    lifestyleMetrics: {
                        ...activeMetrics,
                        room_notes: roomNotes.trim() || undefined,
                    },
                    clutterPhotoUrls,
                }),
            })

            const data = await res.json()
            clearInterval(tickerInterval)

            if (!res.ok || !data.success) {
                if (res.status === 402) {
                    setSubmitError("Insufficient credits. Please purchase a credit pack below to proceed.")
                    setIsSubmitting(false)
                    return
                }
                throw new Error(data.error || "Failed to generate transformation plan.")
            }

            // Successfully analyzed — redirect to the results dashboard
            router.push(`/tools/space-planner/audit/${data.audit.id}`)
        } catch (err: any) {
            clearInterval(tickerInterval)
            setIsSubmitting(false)
            setSubmitError(err.message || "An error occurred while generating your space plan.")
        }
    }

    const roomsList =
        spaceContext === "home"
            ? HOME_ROOMS
            : spaceContext === "classroom"
                ? CLASSROOM_ROOMS
                : BUSINESS_ROOMS

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Step Progress Tracker */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-3 px-2">
                    {[
                        { num: 1, label: "Room & Goals" },
                        { num: 2, label: "Clutter Photos" },
                        { num: 3, label: "Environment & Budget" },
                        { num: 4, label: "Review & Generate" },
                    ].map((step) => {
                        const isActive = currentStep === step.num
                        const isCompleted = currentStep > step.num

                        return (
                            <button
                                key={step.num}
                                onClick={() => !isSubmitting && step.num < currentStep && setCurrentStep(step.num)}
                                className={`flex items-center gap-2 text-left transition-opacity ${isActive ? "opacity-100" : isCompleted ? "opacity-70 hover:opacity-100" : "opacity-30"
                                    }`}
                            >
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${isCompleted
                                            ? "bg-emerald-500 text-black"
                                            : isActive
                                                ? "bg-accent text-black scale-110 shadow-lg"
                                                : "bg-white/10 text-white"
                                        }`}
                                >
                                    {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline text-white">
                                    {step.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                    />
                </div>
            </div>

            {/* Wizard Form Card */}
            <div className="p-6 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                <AnimatePresence mode="wait">
                    {/* ================================================================= */}
                    {/* STEP 1: TRACK & ROOM SELECTION */}
                    {/* ================================================================= */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Track Selector */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-3">
                                    1. Choose Environment Track
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: "home", label: "Home", icon: Home, desc: "Living rooms, pantries, closets, garages" },
                                        { id: "classroom", label: "Classroom", icon: GraduationCap, desc: "Pre-K to high school, STEM labs, sensory" },
                                        { id: "business", label: "Business", icon: Building2, desc: "Offices, retail, stockrooms, restaurants" },
                                    ].map((t) => {
                                        const isSelected = spaceContext === t.id
                                        const Icon = t.icon
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setSpaceContext(t.id as SpaceContext)}
                                                className={`p-5 rounded-2xl text-left border transition-all duration-200 ${isSelected
                                                        ? "bg-accent/10 border-accent shadow-md shadow-accent/5"
                                                        : "bg-white/[0.02] border-white/10 hover:border-white/20"
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${isSelected ? "bg-accent text-black" : "bg-white/5 text-white/70"}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="font-bold text-white text-sm uppercase tracking-tight">{t.label} Track</div>
                                                <div className="text-white/50 text-[11px] mt-1 leading-snug">{t.desc}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Room Type Picker */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-3">
                                    2. Select Room Type
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                                    {roomsList.map((r) => {
                                        const isSelected = roomType === r.id
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setRoomType(r.id)}
                                                className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${isSelected
                                                        ? "bg-accent text-black border-accent font-bold"
                                                        : "bg-white/[0.02] border-white/10 text-white/80 hover:border-white/20"
                                                    }`}
                                            >
                                                {r.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Custom Room Title (Optional) */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-2">
                                    Room Title / Nickname (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={roomTitle}
                                    onChange={(e) => setRoomTitle(e.target.value)}
                                    placeholder={
                                        spaceContext === "home"
                                            ? "e.g. Master Walk-in Closet"
                                            : spaceContext === "classroom"
                                                ? "e.g. Mrs. Higgins' 3rd Grade STEM Room"
                                                : "e.g. 5th Ave Boutique Stockroom"
                                    }
                                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent"
                                />
                            </div>

                            {/* Goals Multi-Select */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-3">
                                    3. Transformation Goals (Select all that apply)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {ALL_GOALS.map((g) => {
                                        const isSelected = goals.includes(g.id)
                                        return (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => toggleGoal(g.id)}
                                                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${isSelected
                                                        ? "bg-accent/15 border-accent text-white"
                                                        : "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/20"
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${isSelected ? "bg-accent border-accent text-black" : "border-white/30"}`}>
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white tracking-tight">{g.label}</div>
                                                    <div className="text-[10px] text-white/50 mt-0.5 leading-snug">{g.desc}</div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Next Action */}
                            <div className="pt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    disabled={goals.length === 0}
                                    className="px-8 py-3.5 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <span>Continue to Photos</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ================================================================= */}
                    {/* STEP 2: CLUTTER CAPTURE & PHOTOS */}
                    {/* ================================================================= */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1">
                                    Upload Room Clutter Photos
                                </h3>
                                <p className="text-white/60 text-xs leading-relaxed">
                                    Upload photos of the current space from multiple angles. Our client-side compression automatically shrinks high-res mobile photos before secure upload to Supabase storage.
                                </p>
                            </div>

                            {/* Dropzone */}
                            <div className="border-2 border-dashed border-white/20 hover:border-accent/50 rounded-3xl p-8 text-center transition-all bg-white/[0.01]">
                                <input
                                    type="file"
                                    id="photo-input"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,image/heic"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="photo-input"
                                    className="cursor-pointer flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                        {isCompressing ? (
                                            <Loader2 size={26} className="animate-spin" />
                                        ) : (
                                            <UploadCloud size={28} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white uppercase tracking-tight">
                                            {isCompressing ? "Compressing & Uploading..." : "Click or Drag & Drop Photos"}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">
                                            Supports JPG, PNG, WEBP (up to 5 photos recommended)
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Photo Gallery Grid */}
                            {photos.length > 0 && (
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-3">
                                        Attached Photos ({photos.length})
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {photos.map((photo, idx) => (
                                            <div
                                                key={idx}
                                                className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-black/40"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={photo.url}
                                                    alt={`Clutter capture ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {photo.isUploading && (
                                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                        <Loader2 size={20} className="animate-spin text-accent" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(idx)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white/80 hover:text-red-400 hover:bg-black transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Optional Notes / Dimensions */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-2">
                                    Dimensions or Spatial Constraints (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={roomNotes}
                                    onChange={(e) => setRoomNotes(e.target.value)}
                                    placeholder="e.g. Dimensions are approx 10x12 ft. Only adhesive hooks allowed on north wall. Electrical panel located behind door."
                                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent"
                                />
                            </div>

                            {/* Nav Buttons */}
                            <div className="pt-4 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="px-8 py-3.5 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center gap-2"
                                >
                                    <span>Next: Environment & Budget</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ================================================================= */}
                    {/* STEP 3: LIFESTYLE & BUDGET METRICS */}
                    {/* ================================================================= */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1">
                                    {spaceContext === "home"
                                        ? "Home Lifestyle Metrics"
                                        : spaceContext === "classroom"
                                            ? "Classroom Operational Metrics"
                                            : "Business & Safety Heuristics"}
                                </h3>
                                <p className="text-white/60 text-xs leading-relaxed">
                                    These variables instruct the AI to formulate realistic ergonomics, maintenance time limits, and compliance clearance rules.
                                </p>
                            </div>

                            {/* HOME TRACK DYNAMIC FIELDS */}
                            {spaceContext === "home" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Household Size
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={homeMetrics.family_size}
                                            onChange={(e) =>
                                                setHomeMetrics({ ...homeMetrics, family_size: parseInt(e.target.value) || 1 })
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Pets in Household?
                                        </label>
                                        <div className="flex gap-2">
                                            {[true, false].map((hasPetVal) => (
                                                <button
                                                    key={String(hasPetVal)}
                                                    type="button"
                                                    onClick={() => setHomeMetrics({ ...homeMetrics, has_pets: hasPetVal })}
                                                    className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase ${homeMetrics.has_pets === hasPetVal
                                                            ? "bg-accent text-black border-accent"
                                                            : "bg-white/[0.02] border-white/10 text-white/70"
                                                        }`}
                                                >
                                                    {hasPetVal ? "Yes, Has Pets" : "No Pets"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Desired Design Aesthetic
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {[
                                                { id: "modern_clean", label: "Modern Clean" },
                                                { id: "minimalist", label: "Minimalist" },
                                                { id: "cozy_functional", label: "Cozy Warm" },
                                                { id: "industrial", label: "Industrial" },
                                            ].map((a) => (
                                                <button
                                                    key={a.id}
                                                    type="button"
                                                    onClick={() => setHomeMetrics({ ...homeMetrics, desired_aesthetic: a.id as any })}
                                                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold ${homeMetrics.desired_aesthetic === a.id
                                                            ? "bg-accent text-black border-accent font-bold"
                                                            : "bg-white/[0.02] border-white/10 text-white/70"
                                                        }`}
                                                >
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CLASSROOM TRACK DYNAMIC FIELDS */}
                            {spaceContext === "classroom" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Student Headcount
                                        </label>
                                        <input
                                            type="number"
                                            min={5}
                                            max={60}
                                            value={classroomMetrics.student_count}
                                            onChange={(e) =>
                                                setClassroomMetrics({
                                                    ...classroomMetrics,
                                                    student_count: parseInt(e.target.value) || 20,
                                                })
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Grade Level
                                        </label>
                                        <input
                                            type="text"
                                            value={classroomMetrics.grade_level}
                                            onChange={(e) =>
                                                setClassroomMetrics({ ...classroomMetrics, grade_level: e.target.value })
                                            }
                                            placeholder="e.g. 2nd Grade, Middle School (6-8)"
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Sensory Support Zones Needed?
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setClassroomMetrics({
                                                    ...classroomMetrics,
                                                    sensory_needs: !classroomMetrics.sensory_needs,
                                                })
                                            }
                                            className={`w-full py-3 rounded-xl border text-xs font-bold uppercase ${classroomMetrics.sensory_needs
                                                    ? "bg-emerald-500 text-black border-emerald-500"
                                                    : "bg-white/[0.02] border-white/10 text-white/70"
                                                }`}
                                        >
                                            {classroomMetrics.sensory_needs ? "Sensory Nook Enabled" : "Standard Seating Only"}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            ADA / Wheelchair Clearance?
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setClassroomMetrics({
                                                    ...classroomMetrics,
                                                    accessibility_needs: !classroomMetrics.accessibility_needs,
                                                })
                                            }
                                            className={`w-full py-3 rounded-xl border text-xs font-bold uppercase ${classroomMetrics.accessibility_needs
                                                    ? "bg-blue-500 text-black border-blue-500"
                                                    : "bg-white/[0.02] border-white/10 text-white/70"
                                                }`}
                                        >
                                            {classroomMetrics.accessibility_needs ? "ADA Accessible Aisles Required" : "Standard Spacing"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* BUSINESS TRACK DYNAMIC FIELDS */}
                            {spaceContext === "business" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Staff Headcount
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={businessMetrics.employee_headcount}
                                            onChange={(e) =>
                                                setBusinessMetrics({
                                                    ...businessMetrics,
                                                    employee_headcount: parseInt(e.target.value) || 5,
                                                })
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Customer Foot Traffic
                                        </label>
                                        <select
                                            value={businessMetrics.daily_foot_traffic}
                                            onChange={(e) =>
                                                setBusinessMetrics({
                                                    ...businessMetrics,
                                                    daily_foot_traffic: e.target.value as any,
                                                })
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                                        >
                                            <option value="internal_only_low" className="bg-zinc-900">Internal Only / Low</option>
                                            <option value="moderate_client_facing" className="bg-zinc-900">Moderate Client-Facing</option>
                                            <option value="high_retail_volume" className="bg-zinc-900">High Retail Volume</option>
                                            <option value="heavy_industrial_rush" className="bg-zinc-900">Heavy Industrial Rush</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                            Compliance Requirements
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {[
                                                { id: "osha_general", label: "OSHA General Safety" },
                                                { id: "health_code_food_safety", label: "Health Code (NSF)" },
                                                { id: "ada_accessibility", label: "ADA Wheelchair Clearance" },
                                                { id: "fire_code_clearance", label: "Fire Exit Clearance" },
                                                { id: "hipaa_privacy", label: "HIPAA Confidential Storage" },
                                            ].map((comp) => {
                                                const hasIt = businessMetrics.compliance_requirements?.includes(comp.id as any)
                                                return (
                                                    <button
                                                        key={comp.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = businessMetrics.compliance_requirements || []
                                                            const updated = current.includes(comp.id as any)
                                                                ? current.filter((c) => c !== comp.id)
                                                                : [...current, comp.id as any]
                                                            setBusinessMetrics({ ...businessMetrics, compliance_requirements: updated })
                                                        }}
                                                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-2 ${hasIt
                                                                ? "bg-amber-500/15 border-amber-500 text-white"
                                                                : "bg-white/[0.02] border-white/10 text-white/60"
                                                            }`}
                                                    >
                                                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${hasIt ? "bg-amber-500 border-amber-500 text-black" : "border-white/30"}`}>
                                                            {hasIt && <Check size={10} strokeWidth={3} />}
                                                        </div>
                                                        <span className="truncate">{comp.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BUDGET TIER SELECTION */}
                            <div className="pt-4 border-t border-white/10">
                                <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-3">
                                    Hardware & Organizer Budget Tier
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { id: "diy_low", label: "DIY / Low", range: "< $100", desc: "Repurposed & affordable bins" },
                                        { id: "medium", label: "Balanced", range: "$100 - $300", desc: "Modular acrylic & wire systems" },
                                        { id: "high", label: "Premium", range: "$300 - $750", desc: "Uniform custom shelving & organizers" },
                                        { id: "open", label: "Enterprise / Open", range: "$750+", desc: "NSF commercial grade fixtures" },
                                    ].map((b) => {
                                        const isSelected = budgetTier === b.id
                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => setBudgetTier(b.id as BudgetTier)}
                                                className={`p-4 rounded-2xl border text-left transition-all ${isSelected
                                                        ? "bg-accent/15 border-accent text-white shadow-md shadow-accent/5"
                                                        : "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/20"
                                                    }`}
                                            >
                                                <div className="text-xs font-black uppercase text-accent mb-1">{b.range}</div>
                                                <div className="text-xs font-bold text-white">{b.label}</div>
                                                <div className="text-[10px] text-white/50 mt-1 leading-snug">{b.desc}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Nav Buttons */}
                            <div className="pt-4 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(4)}
                                    className="px-8 py-3.5 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all flex items-center gap-2"
                                >
                                    <span>Review & Submit</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ================================================================= */}
                    {/* STEP 4: REVIEW, CREDIT GATE & GENERATION */}
                    {/* ================================================================= */}
                    {currentStep === 4 && (
                        <motion.div
                            key="step-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1">
                                    Review Audit Submission
                                </h3>
                                <p className="text-white/60 text-xs leading-relaxed">
                                    Verify your room configuration before invoking the multimodal vision pipeline.
                                </p>
                            </div>

                            {/* Summary Review Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                        Track & Room
                                    </span>
                                    <span className="text-sm font-bold text-white capitalize">
                                        {spaceContext} Track • {roomType.replace(/_/g, " ")}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                        Photos Uploaded
                                    </span>
                                    <span className="text-sm font-bold text-accent">
                                        {photos.length} Photo{photos.length === 1 ? "" : "s"} Attached
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                                        Budget Tier
                                    </span>
                                    <span className="text-sm font-bold text-white capitalize">
                                        {budgetTier.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>

                            {/* Loading State Animation */}
                            {isSubmitting ? (
                                <div className="p-10 rounded-3xl bg-accent/5 border border-accent/20 text-center space-y-6">
                                    <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto animate-pulse">
                                        <Sparkles size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                                            Generating Spatial Transformation
                                        </h4>
                                        <p className="text-accent text-xs font-bold uppercase tracking-wider animate-pulse">
                                            {PROCESSING_STAGES[processingStageIndex]}
                                        </p>
                                    </div>
                                    <div className="max-w-md mx-auto w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent animate-[indeterminate_2s_infinite]" />
                                    </div>
                                    <p className="text-white/40 text-[11px]">
                                        Please do not close this window while the multimodal model runs.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Credit Gate Status */}
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-white">
                                                    Audit Cost: 1 Space Credit
                                                </div>
                                                <div className="text-xs text-white/50 mt-0.5">
                                                    {loadingCredits ? (
                                                        "Checking account balance..."
                                                    ) : credits?.freeSampleAvailable ? (
                                                        <span className="text-emerald-400 font-semibold">
                                                            Your 1st room audit is complimentary (Free Sample).
                                                        </span>
                                                    ) : credits && credits.balance > 0 ? (
                                                        <span className="text-white/80">
                                                            You have <strong>{credits.balance}</strong> credit{credits.balance > 1 ? "s" : ""} available.
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-400 font-semibold">
                                                            0 Credits remaining. Purchase credits below to launch this audit.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {credits?.hasCredit ? (
                                            <button
                                                type="button"
                                                onClick={handleSubmitAudit}
                                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-black font-black uppercase text-xs tracking-wider hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2"
                                            >
                                                <Sparkles size={16} />
                                                <span>Run Multimodal Audit</span>
                                            </button>
                                        ) : (
                                            <a
                                                href="#pricing-packs"
                                                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 text-white font-bold uppercase text-xs tracking-wider hover:bg-white/20 transition-all text-center"
                                            >
                                                Top Up Credits
                                            </a>
                                        )}
                                    </div>

                                    {/* Error Display */}
                                    {submitError && (
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{submitError}</span>
                                        </div>
                                    )}

                                    {/* Inline Credit Purchase Options if 0 credits */}
                                    {credits && !credits.hasCredit && (
                                        <div id="pricing-packs" className="pt-6 border-t border-white/10">
                                            <div className="text-center mb-6">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-accent mb-1">
                                                    Select a Credit Package to Launch
                                                </h4>
                                                <p className="text-white/50 text-xs">
                                                    Instant checkout with Stripe • Credits never expire
                                                </p>
                                            </div>
                                            <PricingCards userLoggedIn={true} />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Nav Buttons (when not submitting) */}
                            {!isSubmitting && (
                                <div className="pt-4 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(3)}
                                        className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>Back to Step 3</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
