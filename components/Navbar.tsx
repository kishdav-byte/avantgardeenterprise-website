"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Contact", href: "#contact" },
]

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <>
            {/* Main Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-transparent">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 border-2 border-accent rotate-45 flex items-center justify-center transition-transform group-hover:rotate-[135deg] duration-500">
                        <div className="w-4 h-4 bg-accent -rotate-45" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-xl font-black tracking-tighter uppercase">Avant-Garde</span>
                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40">Enterprise</span>
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
                    <button className="px-6 py-2 border border-accent/20 hover:border-accent text-accent text-[11px] font-bold uppercase tracking-[0.2em] transition-all bg-accent/5">
                        Start Project
                    </button>
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
