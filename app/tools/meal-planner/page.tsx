"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MealPlannerApp } from '@/components/meal-planner/MealPlannerApp'
import { Loader2, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { MEAL_PLANNER_CONFIG } from '@/lib/meal-planner-config'
import type { UsageStats, UserProfile } from '@/lib/meal-planner-types'

export default function MealPlannerPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [stats, setStats] = useState<UsageStats | null>(null)

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

            // Get user profile
            const { data: profileData } = await supabase
                .from('clients')
                .select('*')
                .eq('id', session.user.id)
                .single()

            setProfile(profileData)

            // Get usage stats
            const response = await fetch('/api/meal-planner')
            if (response.ok) {
                const statsData = await response.json()
                setStats(statsData)
            }

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
                        Loading...
                    </p>
                </div>
            </div>
        )
    }

    if (!user) {
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
                            Authentication <span className="text-accent">Required</span>
                        </h1>

                        <p className="text-white/60 text-lg mb-8 leading-relaxed">
                            {MEAL_PLANNER_CONFIG.ui.loginRequired}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-all"
                            >
                                Sign In / Sign Up
                            </Link>
                            <Link
                                href="/"
                                className="px-8 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-sm hover:border-white transition-all"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    const isAdmin = profile?.role === 'admin'
    const hasReachedLimit = stats && !isAdmin && stats.monthly_requests >= stats.monthly_limit

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Header Section */}
            <div className="border-b border-white/5 bg-black/40 pt-32 pb-12">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="text-accent" size={24} />
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30">
                                    {MEAL_PLANNER_CONFIG.status}
                                </span>
                                {MEAL_PLANNER_CONFIG.isFree && (
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                                        Free
                                    </span>
                                )}
                                {isAdmin && (
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-500/30">
                                        Admin - Unlimited
                                    </span>
                                )}
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">
                            {MEAL_PLANNER_CONFIG.name}
                        </h1>

                        <p className="text-white/60 text-lg mb-6">
                            {MEAL_PLANNER_CONFIG.tagline}
                        </p>

                        {/* Usage Stats */}
                        {stats && (
                            <div className="flex flex-wrap gap-6 text-sm">
                                <div>
                                    <span className="text-white/40 uppercase tracking-widest font-bold text-xs">
                                        This Month
                                    </span>
                                    <div className="text-2xl font-black text-accent mt-1">
                                        {isAdmin ? '∞' : `${stats.monthly_requests} / ${stats.monthly_limit}`}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-white/40 uppercase tracking-widest font-bold text-xs">
                                        Total Requests
                                    </span>
                                    <div className="text-2xl font-black text-white mt-1">
                                        {stats.total_requests}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-white/40 uppercase tracking-widest font-bold text-xs">
                                        Status
                                    </span>
                                    <div className="text-sm font-black text-emerald-400 uppercase mt-1">
                                        {stats.subscription_status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Limit Warning */}
                        {hasReachedLimit && (
                            <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4">
                                <p className="text-red-400 text-sm font-bold">
                                    ⚠️ {MEAL_PLANNER_CONFIG.ui.limitWarning}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main App */}
            <MealPlannerApp
                userId={user.id}
                isAdmin={isAdmin}
                hasReachedLimit={!!hasReachedLimit}
            />

            <Footer />
        </div>
    )
}
