"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Target, CheckCircle2 } from 'lucide-react'
import drillLibrary from '@/data/k9_drill_library.json'

const TOTAL_WEEKS = 24

const PHASE_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: 'Phase 1: Foundation', color: 'bg-blue-100 text-blue-700' },
    2: { label: 'Phase 2: Obedience', color: 'bg-purple-100 text-purple-700' },
    3: { label: 'Phase 3: Advanced Skills', color: 'bg-amber-100 text-amber-700' },
    4: { label: 'Phase 4: Real-World', color: 'bg-emerald-100 text-emerald-700' },
}

function getPhase(week: number): number {
    if (week <= 6) return 1
    if (week <= 12) return 2
    if (week <= 18) return 3
    return 4
}

export default function PawgressPlanView({ dogId, onAddVideo }: { dogId: string, onAddVideo: () => void }) {
    const [isLoading, setIsLoading] = useState(true)
    const [aiLog, setAiLog] = useState<any>(null)
    const [selectedWeek, setSelectedWeek] = useState(1)

    useEffect(() => {
        const fetchPlan = async () => {
            setIsLoading(true)
            const { data: submissionData } = await supabase
                .from('k9_video_submissions')
                .select(`
                    id,
                    status,
                    k9_ai_feedback_logs (
                        raw_json_response,
                        behavior_evaluation
                    )
                `)
                .eq('dog_id', dogId)
                .eq('status', 'analyzed')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (submissionData?.k9_ai_feedback_logs && submissionData.k9_ai_feedback_logs.length > 0) {
                setAiLog(submissionData.k9_ai_feedback_logs[0])
            }
            setIsLoading(false)
        }
        fetchPlan()
    }, [dogId])

    if (isLoading) {
        return <div className="flex w-full min-h-[400px] items-center justify-center"><Loader2 className="animate-spin text-[#2D2D2D] w-10 h-10" /></div>
    }

    if (!aiLog) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 bg-white rounded-3xl p-12 shadow-sm border border-[#2D2D2D]/5 flex items-center justify-center text-center min-h-[500px]">
                <div className="max-w-md">
                    <div className="w-20 h-20 bg-[#2D2D2D]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2D2D2D]/40">
                        <CalendarIcon size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No Training Plan Yet</h3>
                    <p className="text-[#2D2D2D]/60 text-sm leading-relaxed mb-8">
                        Your dog&apos;s personalized 6-month plan will dynamically generate here. Go to your dog&apos;s profile and click &quot;Generate Plan&quot; to start.
                    </p>
                    <button onClick={onAddVideo} className="px-6 py-3 bg-[#2D2D2D] text-white font-bold rounded-xl hover:bg-black transition-all text-sm">
                        Upload Video
                    </button>
                </div>
            </motion.div>
        )
    }

    // Support both the new weekly_plan schema and the old training_plan schema (backwards compat)
    const rawJson = aiLog.raw_json_response
    const weeklyPlan: any[] = Array.isArray(rawJson?.weekly_plan) ? rawJson.weekly_plan : []

    // Fallback: If it's the old day-based format, convert to week groups of 7
    const legacyPlan: any[] = Array.isArray(rawJson?.training_plan) ? rawJson.training_plan : []
    const isLegacy = weeklyPlan.length === 0 && legacyPlan.length > 0

    const safePlan = weeklyPlan.length > 0 ? weeklyPlan : []

    let currentWeekData: any = safePlan.find((w: any) => w.week === selectedWeek)

    if (!currentWeekData && isLegacy) {
        // Build a synthetic week from legacy daily entries
        const startDay = (selectedWeek - 1) * 7 + 1
        const days = legacyPlan.filter((d: any) => d.day >= startDay && d.day < startDay + 7)
        const firstDay = days[0] || {}
        currentWeekData = {
            week: selectedWeek,
            focus: firstDay.focus || `Week ${selectedWeek}`,
            description: firstDay.description || '',
            daily_routine: firstDay.drills || [],
        }
    }

    if (!currentWeekData) {
        currentWeekData = {
            week: selectedWeek,
            focus: 'Rest & Consolidation',
            description: 'Take this week to reinforce prior learnings, reduce intensity and allow your dog to rest.',
            daily_routine: [],
        }
    }

    const phase = getPhase(selectedWeek)
    const phaseInfo = PHASE_LABELS[phase]

    return (
        <div className="flex flex-col gap-6">

            {/* AI Actionable Feedback Banner */}
            {aiLog.behavior_evaluation && aiLog.behavior_evaluation !== "Initial Baseline Assessment generated from textual profile." && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-100 text-blue-600 shrink-0">
                        <Target className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-lg tracking-tight mb-2">Pawgress AI Assessment</h4>
                        <p className="text-gray-700 leading-relaxed text-sm max-w-4xl font-medium">
                            {aiLog.behavior_evaluation}
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left Column — 24-Week Timeline Grid */}
                <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-[#2D2D2D]/5 flex flex-col h-[700px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">6-Month Master Plan</h3>
                            <p className="text-[#2D2D2D]/60 text-sm">24 Weeks · Generated by Pawgress AI</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={selectedWeek === 1}
                                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                                className="p-2 border border-[#2D2D2D]/10 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                disabled={selectedWeek === TOTAL_WEEKS}
                                onClick={() => setSelectedWeek(Math.min(TOTAL_WEEKS, selectedWeek + 1))}
                                className="p-2 border border-[#2D2D2D]/10 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Phase legends */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {Object.entries(PHASE_LABELS).map(([k, v]) => (
                            <span key={k} className={`text-xs font-bold px-3 py-1 rounded-full ${v.color}`}>{v.label}</span>
                        ))}
                    </div>

                    <div className="overflow-y-auto pr-2 pb-4 styled-scrollbar flex-1">
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                                const weekNum = i + 1
                                const isSelected = selectedWeek === weekNum
                                const isPast = weekNum < selectedWeek
                                const weekPhase = getPhase(weekNum)
                                const phaseColors: Record<number, string> = {
                                    1: 'bg-blue-400',
                                    2: 'bg-purple-400',
                                    3: 'bg-amber-400',
                                    4: 'bg-emerald-400',
                                }

                                return (
                                    <button
                                        key={weekNum}
                                        onClick={() => setSelectedWeek(weekNum)}
                                        className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-h-[90px]
                                            ${isSelected
                                                ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white shadow-lg scale-105 z-10'
                                                : isPast
                                                    ? 'border-[#2D2D2D]/5 bg-gray-50 text-[#2D2D2D]/60 hover:border-[#2D2D2D]/20'
                                                    : 'border-[#2D2D2D]/10 bg-white text-[#2D2D2D] hover:border-[#2D2D2D]/30 shadow-sm'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Week</span>
                                        <span className={`text-xl font-black ${isSelected ? 'text-white' : ''}`}>{weekNum}</span>
                                        {isPast && !isSelected && (
                                            <div className="absolute top-2 right-2 text-emerald-500">
                                                <CheckCircle2 size={12} />
                                            </div>
                                        )}
                                        <div className={`mt-2 w-8 h-1 rounded-full ${isSelected ? 'bg-white/30' : phaseColors[weekPhase]}`} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column — Week Details */}
                <div className="w-full xl:w-[420px] bg-[#FAF9F5] rounded-3xl p-8 shadow-sm border border-[#2D2D2D]/10 flex flex-col h-[700px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Target size={120} />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedWeek}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 flex flex-col h-full"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2D2D2D]/5 rounded-full text-xs font-bold text-[#2D2D2D]/60">
                                    <CalendarIcon size={14} /> Week {selectedWeek} of {TOTAL_WEEKS}
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${phaseInfo.color}`}>
                                    {phaseInfo.label}
                                </span>
                            </div>

                            <h4 className="text-2xl font-black tracking-tight text-[#2D2D2D] mb-3 leading-tight">
                                {currentWeekData.focus}
                            </h4>

                            <p className="text-[#2D2D2D]/70 font-medium leading-relaxed mb-6 text-sm">
                                {currentWeekData.description || "Repeat this routine every training day this week."}
                            </p>

                            <div className="flex-1 overflow-y-auto pr-2 styled-scrollbar">
                                <h5 className="text-xs font-bold uppercase tracking-widest text-[#2D2D2D]/40 mb-3">Daily Routine (Repeat Each Training Day)</h5>
                                <div className="space-y-3">
                                    {currentWeekData.daily_routine && currentWeekData.daily_routine.length > 0 ? (
                                        currentWeekData.daily_routine.map((drillName: string, idx: number) => {
                                            const drillDetail = (drillLibrary as any[]).find((d) => d.name === drillName)
                                            return (
                                                <div key={idx} className="bg-white p-4 rounded-2xl border border-[#2D2D2D]/5 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h6 className="font-bold text-[#2D2D2D] text-sm">{drillName}</h6>
                                                        <div className="text-xs bg-gray-100 px-2 py-1 rounded-md text-[#2D2D2D]/60 font-medium">
                                                            {drillDetail?.duration || '10 mins'}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-[#2D2D2D]/60 leading-relaxed">
                                                        {drillDetail?.instructions || 'Follow standard procedures for this drill.'}
                                                    </p>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="bg-white/50 border border-[#2D2D2D]/5 border-dashed rounded-2xl p-6 text-center">
                                            <p className="text-sm text-[#2D2D2D]/60 font-medium">Rest week! Reinforce previous skills casually.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[#2D2D2D]/10">
                                <button className="w-full py-4 bg-[#2D2D2D] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
                                    <CheckCircle2 size={18} /> Mark Week Complete
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                .styled-scrollbar::-webkit-scrollbar { width: 6px; }
                .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .styled-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(45,45,45,0.1); border-radius: 10px; }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
            `}</style>
        </div>
    )
}
