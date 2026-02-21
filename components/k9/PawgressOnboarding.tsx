"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, ArrowRight, ArrowLeft, Dog, Calendar, Target, Clock, ShieldAlert, Sparkles, Wand2 } from 'lucide-react'

const ENERGY_LEVELS = [
    { label: 'Low', description: 'Couch potato, happy with short walks.' },
    { label: 'Medium', description: 'Enjoys daily walks and some playtime.' },
    { label: 'High', description: 'Needs active exercise and mental stimulation daily.' },
    { label: 'Working', description: 'Tireless. Needs a job or intense activity.' }
]

const SKILL_LEVELS = [
    { label: 'Novice', description: 'Little to no formal training.' },
    { label: 'Beginner', description: 'Knows basics like sit and stay, but distractible.' },
    { label: 'Intermediate', description: 'Reliable basics, working on off-leash or distractions.' },
    { label: 'Advanced', description: 'Highly obedient, ready for complex tasks.' }
]

const COMMON_OUTCOMES = [
    "Family Companion",
    "Hiking/Running Partner",
    "Hunting Dog",
    "Search and Rescue",
    "Protection Dog",
    "Service Dog",
    "Therapy Dog"
]

const COMMON_BREEDS = [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "French Bulldog",
    "Bulldog",
    "Poodle",
    "Beagle",
    "Rottweiler",
    "German Shorthaired Pointer",
    "Dachshund",
    "Other/Mixed"
]

const COMMON_COLORS = [
    "Black",
    "White",
    "Brown",
    "Golden",
    "Yellow",
    "Chocolate",
    "Brindle",
    "Merle",
    "Spotted",
    "Other"
]

export default function PawgressOnboarding({
    userId,
    onComplete,
    initialData = null,
    onCancel
}: {
    userId: string,
    onComplete: () => void,
    initialData?: any,
    onCancel?: () => void
}) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        breed: initialData?.breed || '',
        color: initialData?.color || '',
        akc_registration: initialData?.akc_registration || '',
        birth_date: initialData?.birth_date || '',
        energy_level: initialData?.energy_level || '',
        training_minutes_per_day: initialData?.training_minutes_per_day || 15,
        training_days_per_week: initialData?.training_days_per_week || 5,
        current_skill_level: initialData?.current_skill_level || '',
        current_concerns: initialData?.current_concerns || '',
        desired_outcome: initialData?.desired_outcome || ''
    })

    const updateForm = (key: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const nextStep = () => setStep(s => Math.min(4, s + 1))
    const prevStep = () => setStep(s => Math.max(1, s - 1))

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)
        try {
            // Calculate age in months roughly
            const birthDate = new Date(formData.birth_date)
            const now = new Date()
            const ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth())

            const payload = {
                user_id: userId,
                name: formData.name,
                breed: formData.breed,
                color: formData.color,
                akc_registration: formData.akc_registration,
                birth_date: formData.birth_date,
                age_months: Math.max(0, ageMonths),
                energy_level: formData.energy_level,
                training_minutes_per_day: formData.training_minutes_per_day,
                training_days_per_week: formData.training_days_per_week,
                current_concerns: formData.current_concerns,
                current_skill_level: formData.current_skill_level
            }

            let dogId = initialData?.id;

            if (dogId) {
                // Update Dog
                const { error: dogError } = await supabase.from('k9_dogs').update(payload).eq('id', dogId)
                if (dogError) throw dogError

                // Find active goal
                const { data: goalData } = await supabase.from('k9_training_goals')
                    .select('id').eq('dog_id', dogId).eq('status', 'active').single()

                if (goalData) {
                    const { error: gErr } = await supabase.from('k9_training_goals').update({
                        desired_outcome: formData.desired_outcome
                    }).eq('id', goalData.id)
                    if (gErr) throw gErr
                } else {
                    const { error: gErr } = await supabase.from('k9_training_goals').insert({
                        dog_id: dogId,
                        desired_outcome: formData.desired_outcome,
                        status: 'active'
                    })
                    if (gErr) throw gErr
                }

            } else {
                // Insert Dog
                const { data: dogData, error: dogError } = await supabase.from('k9_dogs').insert(payload).select().single()
                if (dogError) throw dogError
                dogId = dogData.id

                // Insert Goal
                const { error: goalError } = await supabase.from('k9_training_goals').insert({
                    dog_id: dogId,
                    desired_outcome: formData.desired_outcome,
                    status: 'active'
                })
                if (goalError) throw goalError
            }

            onComplete()

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'An error occurred during onboarding.')
            setIsSubmitting(false)
        }
    }

    const isStep1Valid = formData.name && formData.breed && formData.birth_date && formData.energy_level
    const isStep3Valid = formData.current_skill_level
    const isStep4Valid = formData.desired_outcome

    return (
        <div className="w-full max-w-2xl mx-auto min-h-[600px] flex flex-col justify-center py-12 px-4">

            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between mb-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all shadow-sm
                              ${step === i ? 'bg-[#2D2D2D] text-white' : step > i ? 'bg-[#2D2D2D]/10 text-[#2D2D2D]' : 'bg-white text-[#2D2D2D]/30 border border-[#2D2D2D]/10'}`}>
                            {step > i ? '✓' : i}
                        </div>
                    ))}
                </div>
                <div className="h-2 bg-[#2D2D2D]/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: '25%' }}
                        animate={{ width: `${(step / 4) * 100}%` }}
                        className="h-full bg-[#2D2D2D]"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#2D2D2D]/5">
                <AnimatePresence mode="wait">

                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-amber-100 rounded-xl text-amber-700"><Dog size={24} /></div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">Meet Your Partner</h2>
                                    <p className="text-[#2D2D2D]/60 text-sm">Let's get the basic details of your dog.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#2D2D2D]">Name</label>
                                        <input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)}
                                            className="w-full border-2 border-[#2D2D2D]/10 rounded-xl px-4 py-3 focus:border-[#2D2D2D] focus:outline-none transition-colors"
                                            placeholder="e.g., Bowie" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#2D2D2D]">Breed</label>
                                        <select value={formData.breed} onChange={e => updateForm('breed', e.target.value)}
                                            className="w-full border-2 border-[#2D2D2D]/10 rounded-xl px-4 py-3 focus:border-[#2D2D2D] focus:outline-none transition-colors appearance-none bg-white">
                                            <option value="" disabled>Select a breed...</option>
                                            {COMMON_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#2D2D2D]">Color</label>
                                        <select value={formData.color} onChange={e => updateForm('color', e.target.value)}
                                            className="w-full border-2 border-[#2D2D2D]/10 rounded-xl px-4 py-3 focus:border-[#2D2D2D] focus:outline-none transition-colors appearance-none bg-white">
                                            <option value="" disabled>Select a color...</option>
                                            {COMMON_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#2D2D2D]">Birth Date</label>
                                        <input type="date" value={formData.birth_date} onChange={e => updateForm('birth_date', e.target.value)}
                                            className="w-full border-2 border-[#2D2D2D]/10 rounded-xl px-4 py-3 focus:border-[#2D2D2D] focus:outline-none transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#2D2D2D]">AKC Registration Number <span className="text-[#2D2D2D]/40 font-normal">(Optional)</span></label>
                                    <input type="text" value={formData.akc_registration} onChange={e => updateForm('akc_registration', e.target.value)}
                                        className="w-full border-2 border-[#2D2D2D]/10 rounded-xl px-4 py-3 focus:border-[#2D2D2D] focus:outline-none transition-colors uppercase tracking-widest"
                                        placeholder="e.g., SR12345601" />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="text-sm font-bold text-[#2D2D2D]">Energy Level</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {ENERGY_LEVELS.map(level => (
                                            <div key={level.label} onClick={() => updateForm('energy_level', level.label)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.energy_level === level.label ? 'border-[#2D2D2D] bg-[#2D2D2D]/5' : 'border-[#2D2D2D]/10 hover:border-[#2D2D2D]/30'}`}>
                                                <div className="font-bold text-[#2D2D2D] text-sm mb-1">{level.label}</div>
                                                <div className="text-xs text-[#2D2D2D]/60">{level.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-between items-center">
                                {onCancel ? (
                                    <button onClick={onCancel} className="text-[#2D2D2D]/60 font-bold hover:text-[#2D2D2D] transition-colors p-2">Cancel</button>
                                ) : <div />}
                                <button onClick={nextStep} disabled={!isStep1Valid} className="flex items-center gap-2 bg-[#2D2D2D] text-white px-8 py-4 rounded-xl font-bold disabled:opacity-50 hover:bg-black transition-all">
                                    Next Step <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-700"><Clock size={24} /></div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">Training Commitment</h2>
                                    <p className="text-[#2D2D2D]/60 text-sm">Consistency is key. What does your schedule look like?</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-[#2D2D2D] flex items-center justify-between">
                                        <span>Minutes per session</span>
                                        <span className="text-[#2D2D2D]/60 text-xs bg-gray-100 px-3 py-1 rounded-full">{formData.training_minutes_per_day} mins</span>
                                    </label>
                                    <input type="range" min="5" max="60" step="5"
                                        value={formData.training_minutes_per_day} onChange={e => updateForm('training_minutes_per_day', parseInt(e.target.value))}
                                        className="w-full accent-[#2D2D2D]" />
                                    <div className="flex justify-between text-xs text-[#2D2D2D]/40 font-bold"><span>5m</span><span>60m</span></div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-[#2D2D2D] flex items-center justify-between">
                                        <span>Days per week</span>
                                        <span className="text-[#2D2D2D]/60 text-xs bg-gray-100 px-3 py-1 rounded-full">{formData.training_days_per_week} days</span>
                                    </label>
                                    <input type="range" min="1" max="7" step="1"
                                        value={formData.training_days_per_week} onChange={e => updateForm('training_days_per_week', parseInt(e.target.value))}
                                        className="w-full accent-[#2D2D2D]" />
                                    <div className="flex justify-between text-xs text-[#2D2D2D]/40 font-bold"><span>1d</span><span>7d</span></div>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between items-center">
                                <button onClick={prevStep} className="text-[#2D2D2D]/60 font-bold hover:text-[#2D2D2D] transition-colors p-2 flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
                                <button onClick={nextStep} className="flex items-center gap-2 bg-[#2D2D2D] text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all">
                                    Next Step <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-red-100 rounded-xl text-red-700"><ShieldAlert size={24} /></div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">Current State</h2>
                                    <p className="text-[#2D2D2D]/60 text-sm">Where are we starting from?</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-[#2D2D2D]">Current Skill Level</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {SKILL_LEVELS.map(level => (
                                            <div key={level.label} onClick={() => updateForm('current_skill_level', level.label)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.current_skill_level === level.label ? 'border-[#2D2D2D] bg-[#2D2D2D]/5' : 'border-[#2D2D2D]/10 hover:border-[#2D2D2D]/30'}`}>
                                                <div className="font-bold text-[#2D2D2D] text-sm mb-1">{level.label}</div>
                                                <div className="text-xs text-[#2D2D2D]/60">{level.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#2D2D2D]">Current Behavioral Concerns <span className="text-[#2D2D2D]/40 font-normal">(Optional)</span></label>
                                    <textarea value={formData.current_concerns} onChange={e => updateForm('current_concerns', e.target.value)}
                                        className="w-full border-2 border-[#2D2D2D]/10 rounded-xl px-4 py-3 focus:border-[#2D2D2D] focus:outline-none transition-colors h-24 resize-none"
                                        placeholder="e.g., Pulling on leash, reactive to other dogs, separation anxiety..." />
                                </div>
                            </div>

                            <div className="mt-10 flex justify-between items-center">
                                <button onClick={prevStep} className="text-[#2D2D2D]/60 font-bold hover:text-[#2D2D2D] transition-colors p-2 flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
                                <button onClick={nextStep} disabled={!isStep3Valid} className="flex items-center gap-2 bg-[#2D2D2D] text-white px-8 py-4 rounded-xl font-bold disabled:opacity-50 hover:bg-black transition-all">
                                    Final Step <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700"><Target size={24} /></div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">Desired Outcome</h2>
                                    <p className="text-[#2D2D2D]/60 text-sm">What is the ultimate goal with {formData.name || 'your dog'}?</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_OUTCOMES.map(outcome => (
                                        <button key={outcome} onClick={() => updateForm('desired_outcome', outcome)}
                                            className={`px-4 py-2 font-medium text-sm rounded-full border-2 transition-all
                                                ${formData.desired_outcome === outcome ? 'bg-[#2D2D2D] border-[#2D2D2D] text-white' : 'bg-transparent border-[#2D2D2D]/10 text-[#2D2D2D]/60 hover:border-[#2D2D2D]/30'}`
                                            }>
                                            {outcome}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#2D2D2D]/40">
                                        <Wand2 size={18} />
                                    </div>
                                    <input type="text" value={formData.desired_outcome} onChange={e => updateForm('desired_outcome', e.target.value)}
                                        className="w-full border-2 border-[#2D2D2D]/10 rounded-xl pl-10 pr-4 py-4 focus:border-[#2D2D2D] focus:outline-none transition-colors font-medium text-[#2D2D2D]"
                                        placeholder="Or type a highly specific outcome here..." />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 flex justify-between items-center">
                                <button onClick={prevStep} className="text-[#2D2D2D]/60 font-bold hover:text-[#2D2D2D] transition-colors p-2 flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
                                <button onClick={handleSubmit} disabled={!isStep4Valid || isSubmitting} className="flex items-center justify-center min-w-[160px] gap-3 bg-[#2D2D2D] text-white px-8 py-4 rounded-xl font-bold disabled:opacity-50 shadow-lg hover:bg-black transition-all">
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Generate Plan</>}
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    )
}
