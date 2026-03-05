"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const navItems = [
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Products", href: "/products" },
    { name: "Discovery", href: "/ai-readiness" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
]

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)
    const [profile, setProfile] = React.useState<any>(null)
    const router = useRouter()

    React.useEffect(() => {
        let mounted = true

        const fetchProfile = async (userId: string, email?: string) => {
            if (!mounted) return
            try {
                // Use a proper abort signal to prevent long-hanging requests
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 8000)

                // 1. Try by ID
                let { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle()

                // 2. Try by Email fallback (for re-signed up users)
                if (!data && !error && email) {
                    console.log("Navbar: ID mismatch, trying email:", email)
                    const { data: emailData } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('email', email)
                        .maybeSingle()
                    if (emailData) data = emailData
                }

                clearTimeout(timeoutId)
                if (mounted && !error && data) setProfile(data)
            } catch (err) {
                console.warn("Navbar profile fetch failed or timed out.")
            }
        }

        // Initial session check using getUser() for server verification
        const checkSession = async () => {
            try {
                // Use getUser() instead of getSession() for more reliable initial state
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (mounted) {
                    setUser(authUser || null)
                    if (authUser && !profile) {
                        await fetchProfile(authUser.id, authUser.email)
                    }
                }
            } catch (err) {
                console.warn("Navbar initial auth check failed.")
                if (mounted) setUser(null)
            }
        }

        checkSession()

        // Real-time auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (mounted) {
                const sessionUser = session?.user || null
                setUser(sessionUser)

                if (sessionUser && !profile) {
                    await fetchProfile(sessionUser.id, sessionUser.email)
                } else if (!sessionUser) {
                    setProfile(null)
                }
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, []) // Run once on mount to setup listener


    const handleSignOut = async () => {
        console.log("Navbar: Initiating robust sign out...")
        try {
            // Force local state update IMMEDIATELY for snappy UI response
            setUser(null)
            setProfile(null)
            setIsOpen(false)

            // Attempt global sign out
            const { error } = await supabase.auth.signOut()
            if (error) console.warn("Supabase signOut error (continuing cleanup):", error)
        } catch (e) {
            console.error("Sign out error:", e)
        } finally {
            // Comprehensive cleanup
            localStorage.clear()
            sessionStorage.clear()

            // Clear all possible cookies (Next.js auth uses several)
            document.cookie.split(";").forEach((c) => {
                const cookieName = c.trim().split("=")[0]
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
            })

            // Redirect to home and force a hard refresh to wipe all memory states
            router.push('/')
            setTimeout(() => window.location.reload(), 100)
        }
    }

    return (
        <>
            {/* Main Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 border-2 border-accent rotate-45 flex items-center justify-center transition-all duration-500 group-hover:rotate-[225deg] group-hover:scale-110 group-hover:bg-accent/10 relative">
                        <div className="w-full h-full flex items-center justify-center -rotate-45 transition-all duration-500 group-hover:-rotate-[225deg]">
                            <span className="font-black text-accent text-xs tracking-tighter">AG</span>
                        </div>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-lg md:text-xl font-black tracking-tighter text-white group-hover:text-accent transition-colors whitespace-nowrap">avant-garde</span>
                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 group-hover:text-white transition-colors whitespace-nowrap">Enterprise</span>
                    </div>
                </Link>

                {/* Desktop Navigation Link (Top Right) */}
                <nav className="hidden md:flex items-center gap-10">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-accent transition-colors relative group"
                        >
                            {item.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all group-hover:w-full" />
                        </Link>
                    ))}

                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] uppercase font-bold text-white/40 hidden lg:block">Welcome, {profile?.first_name || 'User'}</span>
                            <Link
                                href="/dashboard"
                                className="px-6 py-2 border border-accent hover:bg-accent hover:text-black text-accent text-[11px] font-bold uppercase tracking-[0.2em] transition-all bg-black/50"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500/70 hover:text-red-500 transition-colors px-2"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-6 py-2 border border-white/20 hover:border-white text-white text-[11px] font-bold uppercase tracking-[0.2em] transition-all bg-white/5"
                        >
                            Portal
                        </Link>
                    )}
                </nav>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-white/70 hover:text-accent transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Visual Decorative Sidebar (Left Side - as per "prefer this view") */}
            <aside className="fixed inset-y-0 left-8 z-40 hidden md:flex flex-col items-center justify-center pointer-events-none">
                <div className="w-px h-32 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
                <div className="relative py-12">
                    <span className="rotate-[-90deg] text-[9px] font-bold tracking-[0.5em] uppercase text-white/20 whitespace-nowrap inline-block">
                        Innovation // Lab // 001
                    </span>
                </div>
                <div className="w-px h-32 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
            </aside>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-[60] md:hidden bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <button
                            className="absolute top-8 right-8 text-white/50 hover:text-accent"
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={32} />
                        </button>
                        <div className="flex flex-col gap-8 items-center">
                            {user && (
                                <div className="flex flex-col items-center gap-2 mb-4">
                                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-black font-bold text-2xl">
                                        {profile?.first_name?.[0] || 'U'}
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest text-white/50">Hello, {profile?.first_name}</p>
                                </div>
                            )}

                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-4xl font-black tracking-tighter uppercase hover:text-accent transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}

                            {user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="text-4xl font-black tracking-tighter uppercase text-accent mt-4"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-sm font-bold uppercase tracking-widest text-red-500 mt-8"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="text-4xl font-black tracking-tighter uppercase text-accent mt-4"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login / Portal
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
