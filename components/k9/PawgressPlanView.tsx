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

    let rawJson = aiLog.raw_json_response
    if (typeof rawJson === 'string') {
        try { rawJson = JSON.parse(rawJson) } catch (e) { console.error("Could not parse json string", e) }
    }

    // Sometimes OpenAI wraps JSON in an outer object, or an array directly. Safe destructuring:
    const assessment = rawJson?.assessment || rawJson?.pawgress_plan?.assessment || rawJson?.plan?.assessment;
    let weeklyPlan: any[] = [];
    if (Array.isArray(rawJson)) weeklyPlan = rawJson;
    else if (Array.isArray(rawJson?.weekly_plan)) weeklyPlan = rawJson.weekly_plan;
    else if (Array.isArray(rawJson?.pawgress_plan?.weekly_plan)) weeklyPlan = rawJson.pawgress_plan.weekly_plan;
    else if (Array.isArray(rawJson?.plan?.weekly_plan)) weeklyPlan = rawJson.plan.weekly_plan;

    const totalWeeks = assessment?.recommended_program_weeks || weeklyPlan.length || 24

    // Use loose equality (==) just in case the AI generated "week": "1" instead of "week": 1
    let currentWeekData: any = weeklyPlan.find((w: any) => w.week == selectedWeek) || {
        week: selectedWeek,
        phase: 'Rest',
        focus: 'Rest & Consolidation',
        description: 'This is a lighter week to consolidate what you have learned. Continue light practice on previously mastered skills.',
        daily_routine: [],
        trainer_tip: 'Use this week to review and reinforce. If the dog feels solid, you are ahead of schedule — that is a great sign!'
    }

    const phaseColor = getPhaseColor(currentWeekData.phase || '')

    const noPlanDataWarning = weeklyPlan.length === 0;

    return (
        <div className="flex flex-col gap-6">
            {noPlanDataWarning && process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-xs font-mono overflow-auto max-h-64">
                    <strong>Dev Warning: Failed to parse valid weekly_plan from AI response.</strong><br />
                    <pre>{JSON.stringify(rawJson, null, 2)}</pre>
                </div>
            )}

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

            {/* Plan Section - Weekly Calendar View */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#2D2D2D]/5 flex flex-col min-h-[600px] mb-8">
                {/* Week Navigator Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-[#2D2D2D]/10 gap-6">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight mb-1">Weekly Schedule</h3>
                        <p className="text-[#2D2D2D]/60 text-sm">Focus strictly on this week. Consistent repetition over 7 days builds reliable habits.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-[#FAF9F5] p-2 rounded-2xl border border-[#2D2D2D]/10 self-start md:self-auto shrink-0">
                        <button disabled={selectedWeek === 1} onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                            className="p-3 bg-white border border-[#2D2D2D]/10 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30 flex items-center justify-center">
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex flex-col items-center min-w-[140px] px-2">
                            <span className="text-sm font-black uppercase tracking-widest text-[#2D2D2D]/50 mb-1.5">Week {selectedWeek} of {totalWeeks}</span>
                            {currentWeekData.phase && (
                                <span className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full border ${phaseColor} truncate max-w-[150px]`}>
                                    {currentWeekData.phase}
                                </span>
                            )}
                        </div>

                        <button disabled={selectedWeek === totalWeeks} onClick={() => setSelectedWeek(Math.min(totalWeeks, selectedWeek + 1))}
                            className="p-3 bg-white border border-[#2D2D2D]/10 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30 flex items-center justify-center">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="mb-6 max-w-3xl">
                    <h4 className="text-xl md:text-2xl font-black tracking-tight text-[#2D2D2D] mb-3">{currentWeekData.focus}</h4>
                    <p className="text-[#2D2D2D]/70 font-medium leading-relaxed text-sm">{currentWeekData.description}</p>
                </div>

                {/* Trainer Tip */}
                {currentWeekData.trainer_tip && (
                    <div className="mb-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100 flex gap-4 items-start">
                        <div className="p-2.5 bg-amber-200/50 rounded-xl text-amber-700 shrink-0">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-amber-700 block mb-1">Weekly Trainer Tip</span>
                            <p className="text-amber-900/80 leading-relaxed font-medium text-sm">
                                {currentWeekData.trainer_tip}
                            </p>
                        </div>
                    </div>
                )}

                {/* 7-Day Calendar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 2xl:grid-cols-7 mb-8">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const dayIndex = i + 1;
                        const recommendedDays = assessment?.recommended_days_per_week || 5;
                        const isTrainingDay = dayIndex <= recommendedDays;

                        return (
                            <div key={dayIndex} className={`p-4 xl:p-5 rounded-2xl border-2 flex flex-col h-full ${isTrainingDay ? 'border-[#2D2D2D] bg-[#FAF9F5]' : 'border-dashed border-[#2D2D2D]/10 bg-gray-50'}`}>
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#2D2D2D]/5">
                                    <span className="font-bold text-[#2D2D2D]">Day {dayIndex}</span>
                                    {isTrainingDay ? (
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-white bg-[#2D2D2D] px-2 py-1 rounded-md shadow-sm">Training</span>
                                    ) : (
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-md">Rest</span>
                                    )}
                                </div>

                                {isTrainingDay ? (
                                    <div className="flex-1 space-y-3">
                                        {currentWeekData.daily_routine?.length > 0 ? currentWeekData.daily_routine.map((drillName: string, idx: number) => {
                                            const drillDetail = (drillLibrary as any[]).find((d) => d.name === drillName)
                                            return (
                                                <div key={idx} className="bg-white p-3 rounded-xl border border-[#2D2D2D]/10 shadow-sm flex flex-col justify-between">
                                                    <div>
                                                        <div className="font-bold text-[#2D2D2D] text-sm mb-1 leading-tight">{drillName}</div>
                                                        <p className="text-[11px] text-[#2D2D2D]/50 leading-relaxed mb-3 line-clamp-2">
                                                            {drillDetail?.instructions || 'Follow standard procedures.'}
                                                        </p>
                                                    </div>
                                                    <div className="text-[10px] font-bold tracking-widest uppercase text-[#2D2D2D]/40 bg-[#FAF9F5] px-2 py-1 rounded-md w-fit">
                                                        {drillDetail?.duration || '10 mins'}
                                                    </div>
                                                </div>
                                            )
                                        }) : (
                                            <div className="flex items-center justify-center h-full min-h-[100px] text-center">
                                                <p className="text-xs font-medium text-[#2D2D2D]/40">No specific drills. Review & reinforce.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center min-h-[120px] text-center opacity-50 px-2">
                                        <CalendarIcon className="w-6 h-6 mb-2 text-gray-400" />
                                        <p className="text-[11px] font-medium text-gray-500 leading-relaxed">Let your dog rest and process what they've learned.</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="pt-6 border-t border-[#2D2D2D]/10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <p className="text-xs font-bold text-[#2D2D2D]/40 uppercase tracking-widest text-center sm:text-left">
                        Complete all {assessment?.recommended_days_per_week || 5} training days before advancing.
                    </p>
                    <button className="w-full sm:w-auto px-8 py-4 bg-[#2D2D2D] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all text-sm">
                        <CheckCircle2 size={18} /> Mark Week Complete
                    </button>
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
