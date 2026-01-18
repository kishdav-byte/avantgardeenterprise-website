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

        // Safety timeout to prevent infinite spinning
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Dashboard loading timed out. Forcing UI render.")
                setLoading(false)
            }
        }, 8000)

        const getSession = async () => {
            // Local client to prevent singleton conflicts
            const { createBrowserClient } = await import('@supabase/ssr')
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) throw sessionError

                if (!session) {
                    console.log("No session found, redirecting to login...")
                    router.push('/login')
                    return
                }

                if (mounted) setUser(session.user)

                // Fetch profile data from our custom 'clients' table
                console.log('Fetching profile for:', session.user.id)
                const { data: profile, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                if (error) {
                    if (error.message?.includes('AbortError') || (error as any).name === 'AbortError') {
                        return // Ignore aborts
                    }
                    console.error("Profile Fetch Error details:", error)
                } else {
                    console.log('Profile fetched:', profile ? 'Found' : 'Not Found')
                }

                if (mounted) {
                    if (profile) setClientData(profile)
                    setLoading(false)
                }
            } catch (e: any) {
                // Ignore AbortError
                if (e.name === 'AbortError' || e.message?.includes('AbortError')) {
                    return
                }
                console.error("Dashboard Session Error:", e)
                if (mounted) setLoading(false)
            }
        }

        getSession()

        return () => {
            mounted = false
            clearTimeout(timeoutId)
        }
    }, [router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
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

                            {/* Activity Teaser */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center mb-6 text-white/20">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-lg font-bold uppercase tracking-tighter mb-2">No Active Projects</h3>
                                <p className="text-white/40 text-sm max-w-xs mb-8">Your account is active. When we begin a project, your files and progress will appear here.</p>
                                <button className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-accent transition-colors">
                                    Start New Inquiry
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
