"use client"

import {
    LayoutDashboard,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Shield,
    Compass
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

export function DashboardSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
    const router = useRouter()
    const pathname = usePathname()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <aside className="w-64 border-r border-white/10 hidden md:flex flex-col p-6 gap-8 h-screen sticky top-0 overflow-y-auto pt-24">
            <div className="space-y-2">
                <Link href="/" className="mb-6 block px-3">
                    <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:text-white transition-colors flex items-center gap-2">
                        ← Return to Website
                    </button>
                </Link>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 px-3">Main Menu</p>

                <Link href="/dashboard">
                    <SidebarItem
                        icon={<LayoutDashboard size={18} />}
                        label="Overview"
                        active={pathname === '/dashboard'}
                    />
                </Link>

                <Link href="/dashboard/workbook">
                    <SidebarItem
                        icon={<Compass size={18} />}
                        label="Implementation Workbook"
                        active={pathname === '/dashboard/workbook'}
                    />
                </Link>

                <SidebarItem icon={<Calendar size={18} />} label="Appointments" />
                <SidebarItem icon={<FileText size={18} />} label="Project Files" />
                <SidebarItem icon={<Settings size={18} />} label="Settings" />

                {isAdmin && (
                    <>
                        <div className="w-full h-px bg-white/5 my-4" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 px-3">Admin Controls</p>

                        <Link href="/dashboard/admin">
                            <SidebarItem
                                icon={<Shield size={18} />}
                                label="Blog Generator"
                                active={pathname?.startsWith('/dashboard/admin')}
                            />
                        </Link>
                    </>
                )}
            </div>

            <div className="mt-auto">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 text-white/40 hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-widest w-full text-left"
                >
                    <LogOut size={18} /> Exit Portal
                </button>
            </div>
        </aside>
    )
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all mb-1 ${active ? 'bg-accent/10 text-accent border border-accent/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
            {icon}
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
    )
}
