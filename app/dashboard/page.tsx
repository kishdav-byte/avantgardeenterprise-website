"use client"

import { useEffect, useState, useRef } from "react"
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
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let mounted = true

        const initialize = async () => {
            try {
                // Single, non-blocking check
                const { data: { user: currentUser } } = await supabase.auth.getUser()
                if (!mounted) return

                if (currentUser) {
                    setUser(currentUser)
                    // Fire-and-forget profile sync
                    const { data: profile } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle()

                    if (mounted && profile) {
                        setClientData(profile)
                    }
                } else {
                    // SECURE REDIRECT: Redirect to login if no user session found
                    if (mounted) {
                        router.push('/login')
                    }
                }
            } catch (e) {
                console.error("DASHBOARD: Init error:", e)
            }
        }

        initialize()

        return () => {
            mounted = false
        }
    }, []) // Run EXACTLY once on mount

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.warn("Dashboard: Sign out error:", e)
        } finally {
            // Comprehensive cleanup
            localStorage.clear()
            sessionStorage.clear()

            // Clear all possible cookies
            document.cookie.split(";").forEach((c) => {
                const cookieName = c.trim().split("=")[0]
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
            })

            router.push('/login')
            setTimeout(() => window.location.reload(), 100)
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 flex min-h-screen">
                {/* Sidebar Navigation */}
                <DashboardSidebar isAdmin={true} />

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
                                    <ProfileItem
                                        label="Member Since"
                                        value={(() => {
                                            if (!clientData?.created_at) return 'N/A';
                                            const d = new Date(clientData.created_at);
                                            return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
                                        })()}
                                    />
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
