"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Target, CheckCircle2, Brain, Clock, Lightbulb, Award } from 'lucide-react'
import drillLibrary from '@/data/k9_drill_library.json'

const PHASE_COLORS: Record<string, string> = {
    'Foundation': 'bg-blue-100 text-blue-700 border-blue-200',
    'Obedience': 'bg-purple-100 text-purple-700 border-purple-200',
    'Intermediate': 'bg-amber-100 text-amber-700 border-amber-200',
    'Advanced': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Real-World': 'bg-rose-100 text-rose-700 border-rose-200',
    'Socialization': 'bg-sky-100 text-sky-700 border-sky-200',
    'default': 'bg-gray-100 text-gray-700 border-gray-200',
}

function getPhaseColor(phase: string): string {
    for (const key of Object.keys(PHASE_COLORS)) {
        if (phase?.toLowerCase().includes(key.toLowerCase())) return PHASE_COLORS[key]
    }
    return PHASE_COLORS['default']
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
                        behavior_evaluation,
                        handler_evaluation
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
                        Go to your dog&apos;s profile and click &quot;Generate Plan&quot; to receive your personalized AI training roadmap.
                    </p>
                    <button onClick={onAddVideo} className="px-6 py-3 bg-[#2D2D2D] text-white font-bold rounded-xl hover:bg-black transition-all text-sm">
                        Upload Video
                    </button>
                </div>
            </motion.div>
        )
    }

    const rawJson = aiLog.raw_json_response
    const assessment = rawJson?.assessment
    const weeklyPlan: any[] = Array.isArray(rawJson?.weekly_plan) ? rawJson.weekly_plan : []

    const totalWeeks = assessment?.recommended_program_weeks || weeklyPlan.length || 24

    let currentWeekData: any = weeklyPlan.find((w: any) => w.week === selectedWeek) || {
        week: selectedWeek,
        phase: 'Rest',
        focus: 'Rest & Consolidation',
        description: 'This is a lighter week to consolidate what you have learned. Continue light practice on previously mastered skills.',
        daily_routine: [],
        trainer_tip: 'Use this week to review and reinforce. If the dog feels solid, you are ahead of schedule — that is a great sign!'
    }

    const phaseColor = getPhaseColor(currentWeekData.phase || '')

    return (
        <div className="flex flex-col gap-6">

            {/* AI Expert Assessment Panel */}
            {assessment && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-[#2D2D2D]/8 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#2D2D2D] to-[#444] px-8 py-5 flex items-center gap-4">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-lg tracking-tight">Pawgress AI Expert Assessment</h4>
                            <p className="text-white/60 text-xs font-medium">Personalized analysis based on your dog&apos;s breed, age, and goal</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Recommended Schedule Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
                                <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                <div className="text-2xl font-black text-blue-700">{assessment.recommended_session_minutes}<span className="text-sm font-bold"> min</span></div>
                                <div className="text-xs text-blue-600/80 font-semibold mt-0.5">Per Session</div>
                            </div>
                            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 text-center">
                                <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                <div className="text-2xl font-black text-purple-700">{assessment.recommended_sessions_per_day}<span className="text-sm font-bold">x</span></div>
                                <div className="text-xs text-purple-600/80 font-semibold mt-0.5">Sessions / Day</div>
                            </div>
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                                <CalendarIcon className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                <div className="text-2xl font-black text-amber-700">{assessment.recommended_days_per_week}<span className="text-sm font-bold"> days</span></div>
                                <div className="text-xs text-amber-600/80 font-semibold mt-0.5">Per Week</div>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
                                <Award className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                <div className="text-2xl font-black text-emerald-700">{assessment.recommended_program_weeks}<span className="text-sm font-bold"> wks</span></div>
                                <div className="text-xs text-emerald-600/80 font-semibold mt-0.5">Program Length</div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Breed Notes */}
                            {assessment.breed_notes && (
                                <div className="bg-[#FAF9F5] rounded-2xl p-5 border border-[#2D2D2D]/5">
                                    <h5 className="text-xs font-black uppercase tracking-widest text-[#2D2D2D]/40 mb-3">Breed Profile</h5>
                                    <p className="text-sm text-[#2D2D2D]/80 leading-relaxed">{assessment.breed_notes}</p>
                                </div>
                            )}
                            {/* Goal Complexity */}
                            {assessment.goal_complexity && (
                                <div className="bg-[#FAF9F5] rounded-2xl p-5 border border-[#2D2D2D]/5">
                                    <h5 className="text-xs font-black uppercase tracking-widest text-[#2D2D2D]/40 mb-3">Goal Complexity</h5>
                                    <p className="text-sm text-[#2D2D2D]/80 leading-relaxed">{assessment.goal_complexity}</p>
                                </div>
                            )}
                            {/* Trainer Note */}
                            {assessment.trainer_note && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                                    <h5 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3">Expert Trainer Note</h5>
                                    <p className="text-sm text-blue-900/80 leading-relaxed">{assessment.trainer_note}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Plan Section */}
            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left: Week Grid */}
                <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-[#2D2D2D]/5 flex flex-col h-[680px]">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">Training Roadmap</h3>
                            <p className="text-[#2D2D2D]/60 text-sm">{totalWeeks} Weeks · Generated by Pawgress AI</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button disabled={selectedWeek === 1} onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                                className="p-2 border border-[#2D2D2D]/10 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30">
                                <ChevronLeft size={18} />
                            </button>
                            <button disabled={selectedWeek === totalWeeks} onClick={() => setSelectedWeek(Math.min(totalWeeks, selectedWeek + 1))}
                                className="p-2 border border-[#2D2D2D]/10 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-30">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-2 pb-4 styled-scrollbar flex-1">
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: totalWeeks }).map((_, i) => {
                                const weekNum = i + 1
                                const isSelected = selectedWeek === weekNum
                                const isPast = weekNum < selectedWeek
                                const weekObj = weeklyPlan.find((w: any) => w.week === weekNum)
                                const weekPhase = weekObj?.phase || ''
                                const color = getPhaseColor(weekPhase)
                                const dotColor = color.split(' ')[0].replace('bg-', 'bg-').replace('100', '400')

                                return (
                                    <button key={weekNum} onClick={() => setSelectedWeek(weekNum)}
                                        className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-h-[88px]
                                            ${isSelected
                                                ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white shadow-lg scale-105 z-10'
                                                : isPast
                                                    ? 'border-[#2D2D2D]/5 bg-gray-50 text-[#2D2D2D]/60 hover:border-[#2D2D2D]/20'
                                                    : 'border-[#2D2D2D]/10 bg-white text-[#2D2D2D] hover:border-[#2D2D2D]/30 shadow-sm'
                                            }`}>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Week</span>
                                        <span className={`text-xl font-black ${isSelected ? 'text-white' : ''}`}>{weekNum}</span>
                                        {isPast && !isSelected && (
                                            <div className="absolute top-2 right-2 text-emerald-500"><CheckCircle2 size={12} /></div>
                                        )}
                                        <div className={`mt-1.5 w-7 h-1 rounded-full ${isSelected ? 'bg-white/30' : dotColor}`} />
                                        {weekObj?.phase && !isSelected && (
                                            <span className="text-[9px] font-bold opacity-50 mt-1 truncate w-full text-center">{weekObj.phase}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Week Detail */}
                <div className="w-full xl:w-[430px] bg-[#FAF9F5] rounded-3xl p-8 shadow-sm border border-[#2D2D2D]/10 flex flex-col h-[680px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Target size={120} /></div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedWeek}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 flex flex-col h-full"
                        >
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2D2D2D]/5 rounded-full text-xs font-bold text-[#2D2D2D]/60">
                                    <CalendarIcon size={13} /> Week {selectedWeek} of {totalWeeks}
                                </div>
                                {currentWeekData.phase && (
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${phaseColor}`}>
                                        {currentWeekData.phase}
                                    </span>
                                )}
                            </div>

                            <h4 className="text-2xl font-black tracking-tight text-[#2D2D2D] mb-3 leading-tight">
                                {currentWeekData.focus}
                            </h4>

                            <p className="text-[#2D2D2D]/70 font-medium leading-relaxed mb-5 text-sm">
                                {currentWeekData.description}
                            </p>

                            <div className="flex-1 overflow-y-auto pr-1 styled-scrollbar space-y-4">
                                {/* Daily Routine */}
                                <div>
                                    <h5 className="text-xs font-black uppercase tracking-widest text-[#2D2D2D]/40 mb-3">Daily Routine</h5>
                                    <div className="space-y-2.5">
                                        {currentWeekData.daily_routine && currentWeekData.daily_routine.length > 0 ? (
                                            currentWeekData.daily_routine.map((drillName: string, idx: number) => {
                                                const drillDetail = (drillLibrary as any[]).find((d) => d.name === drillName)
                                                return (
                                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-[#2D2D2D]/5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-1.5">
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
                                            <div className="bg-white/50 border border-[#2D2D2D]/5 border-dashed rounded-2xl p-5 text-center">
                                                <p className="text-sm text-[#2D2D2D]/60 font-medium">Rest week — light review only.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trainer Tip */}
                                {currentWeekData.trainer_tip && (
                                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Lightbulb className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs font-black uppercase tracking-widest text-amber-600">Trainer Tip</span>
                                        </div>
                                        <p className="text-sm text-amber-900/80 leading-relaxed font-medium">
                                            {currentWeekData.trainer_tip}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-[#2D2D2D]/10">
                                <button className="w-full py-3.5 bg-[#2D2D2D] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all text-sm">
                                    <CheckCircle2 size={17} /> Mark Week Complete
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                .styled-scrollbar::-webkit-scrollbar { width: 5px; }
                .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .styled-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(45,45,45,0.1); border-radius: 10px; }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
            `}</style>
        </div>
    )
}
