"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    CalendarDays,
    Video,
    BookImage,
    Settings,
    Bell,
    Upload,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Loader2,
    Camera,
    Wand2,
    Dog
} from 'lucide-react'
import PawgressOnboarding from './PawgressOnboarding'
import PawgressPlanView from './PawgressPlanView'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PawgressApp({ userId }: { userId: string }) {
    const [isLoading, setIsLoading] = useState(true)
    const [needsOnboarding, setNeedsOnboarding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [dogProfile, setDogProfile] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'dashboard' | 'plan' | 'video' | 'scrapbook' | 'settings'>('dashboard')
    const [desiredOutcome, setDesiredOutcome] = useState("")
    const [isEditingOutcome, setIsEditingOutcome] = useState(false)

    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const fetchDogData = async () => {
        setIsLoading(true)
        const { data: dog } = await supabase.from('k9_dogs').select('*').eq('user_id', userId).single()
        if (!dog) {
            setNeedsOnboarding(true)
        } else {
            setDogProfile(dog)
            setNeedsOnboarding(false)

            const { data: goal } = await supabase.from('k9_training_goals').select('*').eq('dog_id', dog.id).eq('status', 'active').single()
            if (goal) {
                setDesiredOutcome(goal.desired_outcome)
            }
        }
        setIsLoading(false)
    }

    const generateAIImage = async () => {
        if (!dogProfile) return
        setIsGeneratingImage(true)
        try {
            const res = await fetch('/api/k9/generate-dog-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dogId: dogProfile.id })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to generate image.')
            }
            const data = await res.json()
            setDogProfile({ ...dogProfile, profile_image_url: data.imageUrl })
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsGeneratingImage(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !dogProfile) return

        setIsUploadingImage(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/${dogProfile.id}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('k9-images')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage.from('k9-images').getPublicUrl(fileName)
            const imageUrl = publicUrlData.publicUrl

            const { error: updateError } = await supabase.from('k9_dogs')
                .update({ profile_image_url: imageUrl })
                .eq('id', dogProfile.id)

            if (updateError) throw updateError

            setDogProfile({ ...dogProfile, profile_image_url: imageUrl })
        } catch (error: any) {
            console.error(error)
            alert('Error uploading image: ' + error.message)
        } finally {
            setIsUploadingImage(false)
        }
    }

    useEffect(() => {
        fetchDogData()
    }, [userId])

    if (isLoading) return <div className="flex w-full items-center justify-center p-32"><Loader2 className="animate-spin text-[#2D2D2D] w-12 h-12" /></div>
    if (needsOnboarding || isEditing) {
        return <PawgressOnboarding
            userId={userId}
            onComplete={() => {
                setIsEditing(false)
                fetchDogData()
            }}
            initialData={isEditing ? { ...dogProfile, desired_outcome: desiredOutcome } : null}
            onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
    }

    const displayImage = "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=400"


    // Layout configuration
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'plan', label: 'Training Plan', icon: CalendarDays },
        { id: 'video', label: 'Video Analysis', icon: Video },
        { id: 'scrapbook', label: 'Scrapbook', icon: BookImage },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex gap-8">
            {/* Sidebar Navbar */}
            <aside className="w-64 shrink-0 flex flex-col gap-6 sticky top-24 h-[calc(100vh-8rem)]">
                <div className="flex items-center gap-2 px-2 pb-6">
                    <div className="w-8 h-8 bg-[#2D2D2D] rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-xs">PAW</span>
                    </div>
                    <span className="font-extrabold tracking-widest uppercase text-xl">Flow</span>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                                ${activeTab === item.id
                                    ? 'bg-[#2D2D2D] text-white shadow-lg'
                                    : 'text-[#2D2D2D]/60 hover:bg-[#2D2D2D]/5 hover:text-[#2D2D2D]'
                                }
                            `}
                        >
                            <item.icon size={18} className={activeTab === item.id ? "text-white/80" : "text-current"} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto px-4 py-3 border border-[#2D2D2D]/10 rounded-2xl bg-white shadow-sm flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <img src={dogProfile?.profile_image_url || displayImage} className="w-10 h-10 rounded-full object-cover grayscale" alt="User Profile" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2D2D2D] truncate">David K.</p>
                        <p className="text-xs text-[#2D2D2D]/50 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pro Tier</p>
                    </div>
                    <Settings size={16} className="text-[#2D2D2D]/40" />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col gap-6">

                {/* Top Header */}
                <header className="flex items-center justify-between bg-white rounded-3xl p-4 shadow-sm border border-[#2D2D2D]/5 h-20">
                    <h2 className="text-2xl font-bold tracking-tight capitalize ml-4">{activeTab.replace('-', ' ')}</h2>
                    <div className="flex items-center gap-4 mr-4">
                        <button className="p-2 hover:bg-[#2D2D2D]/5 rounded-full transition-colors relative">
                            <Bell size={20} className="text-[#2D2D2D]/60" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-6">
                        {/* Left Column (Profile & Calendar) */}
                        <div className="flex-1 flex flex-col gap-6">

                            {/* Profile Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#2D2D2D]/5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <div className="relative group shrink-0">
                                    {dogProfile?.profile_image_url ? (
                                        <img src={dogProfile.profile_image_url} className="w-32 h-32 rounded-2xl object-cover shadow-sm bg-[#FAF9F5] border border-[#2D2D2D]/10" alt="Dog Profile" />
                                    ) : (
                                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-[#2D2D2D]/10 text-gray-400 overflow-hidden relative">
                                            {isGeneratingImage || isUploadingImage ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-[#2D2D2D]" />
                                            ) : (
                                                <Dog className="w-12 h-12 opacity-50" />
                                            )}
                                        </div>
                                    )}

                                    {/* Image Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center gap-2">
                                        <label className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full cursor-pointer transition-colors flex items-center gap-1.5">
                                            <Camera size={14} /> Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isGeneratingImage || isUploadingImage} />
                                        </label>
                                        <button onClick={generateAIImage} disabled={isGeneratingImage || isUploadingImage} className="text-[10px] font-bold text-white uppercase tracking-widest hover:text-amber-300 transition-colors flex items-center gap-1">
                                            <Wand2 size={12} /> AI Generate
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-3xl font-bold tracking-tight">{dogProfile?.name}</h3>
                                        <button onClick={() => setIsEditing(true)} className="text-xs font-bold px-3 py-1.5 bg-[#2D2D2D]/5 hover:bg-[#2D2D2D]/10 rounded-full transition-colors text-[#2D2D2D]/60 hover:text-[#2D2D2D]">Edit Profile</button>
                                    </div>
                                    <p className="text-[#2D2D2D]/60 text-sm font-medium mb-6">{dogProfile?.color ? `${dogProfile?.color} ` : ''}{dogProfile?.breed}, {dogProfile?.age_months} Months Old</p>

                                    <div className="w-full">
                                        <label className="text-xs font-bold tracking-wider uppercase text-[#2D2D2D]/40 mb-2 block">Desired Outcome:</label>
                                        {isEditingOutcome ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={desiredOutcome}
                                                    onChange={(e) => setDesiredOutcome(e.target.value)}
                                                    onBlur={() => setIsEditingOutcome(false)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingOutcome(false)}
                                                    className="flex-1 border-2 border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-all"
                                                />
                                                <button onClick={() => setIsEditingOutcome(false)} className="p-2.5 bg-[#2D2D2D] text-white rounded-xl"><CheckCircle2 size={18} /></button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setIsEditingOutcome(true)}
                                                className="w-full border border-[#2D2D2D]/10 rounded-xl px-4 py-3 text-sm font-medium text-[#2D2D2D] bg-gray-50/50 hover:border-[#2D2D2D]/30 hover:bg-white cursor-text transition-all"
                                            >
                                                {desiredOutcome || "e.g., 'Master off-leash recall...'"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Training Plan Teaser Widget */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#2D2D2D]/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#2D2D2D]/10 flex items-center justify-center text-[#2D2D2D] shrink-0">
                                        <CalendarDays size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight mb-2 text-[#2D2D2D]">Your Training Roadmap is Ready</h3>
                                        <p className="text-[#2D2D2D]/60 text-sm max-w-sm leading-relaxed font-medium">
                                            The AI has generated a tailored, multi-week training plan for {dogProfile?.name || 'your dog'}. View your daily drills, weekly focus, and expert trainer tips.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveTab('plan')} className="px-6 py-4 bg-[#2D2D2D] text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center gap-2 shrink-0 md:w-auto w-full justify-center">
                                    Open Training Plan <ChevronRight size={18} />
                                </button>
                            </div>

                        </div>

                        {/* Right Column (Upload & Summary) */}
                        <div className="w-full xl:w-[340px] flex flex-col gap-6">

                            {/* Upload Dropzone */}
                            <div className="bg-[#FAF9F5] border border-[#2D2D2D]/10 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:bg-white transition-colors cursor-pointer min-h-[260px] group">
                                <div className="w-16 h-16 bg-[#2D2D2D]/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#2D2D2D] group-hover:text-white transition-all text-[#2D2D2D]">
                                    <Upload size={24} />
                                </div>
                                <h4 className="font-bold text-[#2D2D2D] mb-2 uppercase tracking-tight text-sm">Upload Video <br />For AI Analysis</h4>
                                <p className="text-xs text-[#2D2D2D]/50">MP4, MOV up to 200MB</p>
                            </div>

                            {/* Scrapbook Mini Summary */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#2D2D2D]/5 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest">Scrapbook</h3>
                                    <button onClick={() => setActiveTab('scrapbook')} className="text-xs font-bold hover:underline">View All</button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="h-20 bg-gray-100 rounded-xl overflow-hidden"><img src={displayImage} className="w-full h-full object-cover opacity-80 mix-blend-multiply" /></div>
                                    <div className="h-20 bg-gray-100 rounded-xl overflow-hidden"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover opacity-80" /></div>
                                    <div className="col-span-2 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-[#2D2D2D]/40 border border-dashed border-[#2D2D2D]/10">
                                        + Add Memory
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-[#2D2D2D]/60 leading-relaxed">
                                    "{dogProfile?.name} mastered crate acclimation today..."
                                </p>
                            </div>

                        </div>
                    </motion.div>
                )}

                {activeTab === 'plan' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                        <PawgressPlanView
                            dogId={dogProfile?.id}
                            onAddVideo={() => setActiveTab('video')}
                        />
                    </motion.div>
                )}

                {activeTab !== 'dashboard' && activeTab !== 'plan' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 bg-white rounded-3xl p-12 shadow-sm border border-[#2D2D2D]/5 flex items-center justify-center text-center">
                        <div className="max-w-md">
                            <div className="w-20 h-20 bg-[#2D2D2D]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2D2D2D]/40">
                                {navItems.find(i => i.id === activeTab)?.icon({ size: 32 })}
                            </div>
                            <h3 className="text-2xl font-bold mb-2">{navItems.find(i => i.id === activeTab)?.label} Module</h3>
                            <p className="text-[#2D2D2D]/60 text-sm leading-relaxed">
                                This section is actively being populated and analyzed by Pawgress AI. Once video uploads have been analyzed, full readouts will appear here.
                            </p>
                            {activeTab === 'video' && (
                                <button className="mt-8 px-6 py-3 bg-[#2D2D2D] text-white font-bold rounded-xl hover:bg-black transition-all text-sm">
                                    Start New Analysis
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    )
}
