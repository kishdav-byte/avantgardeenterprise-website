"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Settings,
    LogOut,
    User,
    Mail,
    Bell
} from "lucide-react"

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [clientData, setClientData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        // SAFETY TIMEOUT: If nothing happens in 8 seconds, stop the spinner
        // Reduced to 8s to be more responsive, and we'll show a retry if it fails.
        const timeoutId = setTimeout(() => {
            if (mounted) {
                setLoading(currentLoading => {
                    if (currentLoading) {
                        console.warn("Dashboard loading timed out. User identity may be pending.")
                        return false
                    }
                    return currentLoading
                })
            }
        }, 8000)

        const syncProfile = async (sessionUser: any) => {
            if (!sessionUser || !mounted) return;

            try {
                console.log("Syncing profile for user:", sessionUser.id)
                // Fetch profile data with getUser() verification for maximum consistency
                const { data: profile, error: profileError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .maybeSingle()

                if (profileError) {
                    console.error("Profile Fetch Error:", profileError)
                    throw profileError
                }

                console.log("Profile Sync Complete. Data found:", !!profile)

                if (mounted) {
                    if (profile) {
                        setClientData(profile)
                        setLoading(false)
                        clearTimeout(timeoutId)
                    } else {
                        // No profile found, but we have a user. 
                        // Maybe they are new? Let's not hang.
                        console.warn("No profile found in 'clients' table for user:", sessionUser.id)
                        setLoading(false)
                    }
                }
            } catch (e) {
                console.error("Profile Sync Exception:", e)
                if (mounted) setLoading(false)
            }
        }

        const initializeAuth = async () => {
            try {
                console.log("Initializing Auth (Standard Path)...")

                // Use getUser() for the most reliable network-verified check
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

                if (authError) {
                    console.error("Auth Error:", authError)
                }

                if (!authUser) {
                    console.log("No valid user found, redirecting to login.")
                    if (mounted) router.push('/login')
                    return
                }

                console.log("Auth User Found:", authUser.id)
                if (mounted) {
                    setUser(authUser)
                    // Sync the profile but don't hang the UI if it takes a moment
                    syncProfile(authUser)
                }
            } catch (e) {
                console.error("Dashboard Init Exception:", e)
                if (mounted) {
                    setLoading(false)
                    router.push('/login')
                }
            }
        }

        initializeAuth()

        // Listen for auth changes to handle late-arriving sessions
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user && mounted) {
                    setUser(session.user)
                    await syncProfile(session.user)
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) router.push('/login')
            }
        })

        return () => {
            mounted = false
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [router])

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.warn("Sign out error in dashboard:", e)
        } finally {
            localStorage.clear()
            sessionStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            router.push('/')
            router.refresh()
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 flex min-h-screen">
                {/* Sidebar Navigation */}
                {/* Sidebar Navigation */}
                <DashboardSidebar isAdmin={clientData?.role === 'admin'} />

                {/* Dashboard Content */}
                <section className="flex-1 p-8 md:p-12 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-6xl mx-auto"
                    >
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                                    Welcome, <span className="text-accent">{clientData?.first_name || 'Innovator'}</span>
                                </h1>
                                <p className="text-white/40 text-sm uppercase tracking-[0.2em]">Secure Session // Verified Access</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-accent/30 transition-colors cursor-pointer">
                                    <Bell size={20} className="text-white/60" />
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black font-black text-xs">
                                        {clientData?.first_name?.[0] || 'U'}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">{clientData?.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <StatCard title="Active Inquiries" value="0" sub="Pending Review" />
                            <StatCard title="Total Consults" value="0" sub="Lifetime" />
                            <StatCard title="Security Level" value="L-01" sub="End-to-End Encrypted" />
                        </div>

                        {/* Main Interaction Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Profile Info */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                                <h3 className="text-xl font-bold uppercase tracking-tighter mb-6 flex items-center gap-2">
                                    <User size={20} className="text-accent" /> Profile Identity
                                </h3>
                                <div className="space-y-4">
                                    <ProfileItem label="Email Address" value={clientData?.email} icon={<Mail size={16} />} />
                                    <ProfileItem label="Mailing List" value={clientData?.mailing_list ? "Suscribed" : "Unsubscribed"} />
                                    <ProfileItem label="Member Since" value={new Date(clientData?.created_at).toLocaleDateString()} />
                                </div>
                            </div>

                            {/* Workbook Teaser */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-accent/40 transition-all relative overflow-hidden"
                                onClick={() => router.push('/dashboard/workbook')}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors" />
                                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tighter mb-2 group-hover:text-accent transition-colors italic">Interactive Workbook</h3>
                                <p className="text-white/40 text-sm max-w-xs mb-8 uppercase tracking-widest font-bold">The AI Advantage: Implementation Planner</p>
                                <button className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent transition-colors">
                                    Launch Workbook Interface
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </div>
        </main>
    )
}



function StatCard({ title, value, sub }: { title: string, value: string, sub: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent/20 transition-colors group">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">{title}</p>
            <h4 className="text-4xl font-black tracking-tighter mb-2 group-hover:text-accent transition-colors">{value}</h4>
            <div className="w-full h-px bg-white/5 my-3" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">{sub}</p>
        </div>
    )
}

function ProfileItem({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</span>
            <span className="text-sm font-medium flex items-center gap-2">{icon} {value}</span>
        </div>
    )
}
