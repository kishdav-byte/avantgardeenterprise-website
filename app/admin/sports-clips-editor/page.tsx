"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SportsClipsEditor } from '@/components/admin/SportsClipsEditor'
import { Loader2, Lock, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { SPORTS_CLIPS_CONFIG } from '@/lib/sports-clips-config'

export default function SportsClipsEditorPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    async function checkAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setIsLoading(false)
                return
            }

            setUser(session.user)

            // Get user profile to check admin role
            const { data: profileData } = await supabase
                .from('clients')
                .select('*')
                .eq('id', session.user.id)
                .single()

            setProfile(profileData)

        } catch (error) {
            console.error('Auth check error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
                    <p className="text-white/60 text-sm uppercase tracking-widest font-bold">
                        Verifying Admin Access...
                    </p>
                </div>
            </div>
        )
    }

    const isAdmin = profile?.role === 'admin'

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="container mx-auto px-6 py-32">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="mb-8 inline-block">
                            <div className="w-20 h-20 bg-accent/10 border-2 border-accent rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-10 h-10 text-accent" />
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
                            Admin <span className="text-accent">Access Required</span>
                        </h1>

                        <p className="text-white/60 text-lg mb-8 leading-relaxed">
                            The Sports Clips Editor is an enterprise tool reserved for administrators. Please sign in with an authorized account to continue.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-all underline underline-offset-4"
                            >
                                Admin Login
                            </Link>
                            <Link
                                href="/products"
                                className="px-8 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-sm hover:border-white transition-all"
                            >
                                Explore Products
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Header Section */}
            <div className="border-b border-white/5 bg-black/40 pt-48 pb-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-accent" size={24} />
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30">
                                    {SPORTS_CLIPS_CONFIG.status}
                                </span>
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-500/30">
                                    Enterprise Admin
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                            <div>
                                <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-4 italic italic">
                                    Sports Clips <br /> <span className="text-accent">Editor</span>
                                </h1>
                                <p className="text-white/40 uppercase tracking-[0.4em] text-xs font-black">
                                    {SPORTS_CLIPS_CONFIG.tagline}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 border border-white/10 p-4 rounded-2xl bg-white/[0.02]">
                                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Visual Protocol</p>
                                    <p className="text-[11px] font-bold text-accent uppercase tracking-tight">Active Analysis Engine</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main App */}
            <div className="py-24">
                <div className="container mx-auto px-6">
                    <SportsClipsEditor />
                </div>
            </div>

            <Footer />
        </div>
    )
}
