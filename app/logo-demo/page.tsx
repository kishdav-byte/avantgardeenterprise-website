"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"

export default function LogoDemoPage() {
    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 px-4 md:px-12">
            <div className="max-w-7xl mx-auto space-y-24">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Logo Prototypes</h1>
                    <p className="text-white/50 text-xl max-w-2xl mx-auto mb-12">
                        Hover over each concept to interact. These explore combining the "A, G, Enterprise" with the geometric "Flip" animation you enjoy.
                    </p>
                    <Link href="/" className="text-accent underline uppercase tracking-widest text-sm font-bold">Return Home</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center justify-items-center">

                    {/* OPTION 1: The Monogram Flip */}
                    <div className="flex flex-col items-center gap-8 w-full">
                        <div className="h-40 flex items-center justify-center">
                            <Option1 />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold uppercase tracking-tighter text-accent mb-2">Option 1: The Monogram Flip</h3>
                            <p className="text-sm text-white/50">Retains the exact rotating diamond animation, but replaces the inner square with a specialized "AG" monogram that counter-rotates to stay legible.</p>
                        </div>
                    </div>

                    {/* OPTION 2: The Triangle Prism */}
                    <div className="flex flex-col items-center gap-8 w-full">
                        <div className="h-40 flex items-center justify-center">
                            <Option2 />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold uppercase tracking-tighter text-accent mb-2">Option 2: The Triangle Prism</h3>
                            <p className="text-sm text-white/50">Inspired by your upload. An orange triangle containing "A" that 3D-flips on hover to reveal "G" (Avant-Garde).</p>
                        </div>
                    </div>

                    {/* OPTION 3: The Expanding Box */}
                    <div className="flex flex-col items-center gap-8 w-full">
                        <div className="h-40 flex items-center justify-center">
                            <Option3 />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold uppercase tracking-tighter text-accent mb-2">Option 3: The Kinetic Box</h3>
                            <p className="text-sm text-white/50">A minimal "A" box that expands and re-arranges into "AG" on interaction, revealing the full "Enterprise" tag.</p>
                        </div>
                    </div>

                    {/* OPTION 4: The Typographic Reveal */}
                    <div className="flex flex-col items-center gap-8 w-full">
                        <div className="h-40 flex items-center justify-center">
                            <Option4 />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold uppercase tracking-tighter text-accent mb-2">Option 4: The Typographic Reveal</h3>
                            <p className="text-sm text-white/50">The geometric shapes form the letters themselves. The diamond shape <i>is</i> the "A". Hovering splits it to reveal "G".</p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}

// ----------------------------------------------------------------------
// CONCEPTS
// ----------------------------------------------------------------------

function Option1() {
    return (
        <div className="group cursor-pointer flex items-center gap-4">
            {/* Logo Mark */}
            <div className="w-12 h-12 border-2 border-accent rotate-45 flex items-center justify-center transition-all duration-500 group-hover:rotate-[225deg] group-hover:scale-110 group-hover:bg-accent/10 relative">
                {/* The 'AG' inside that counter-rotates so it stays upright relative to viewer, or rotates with it? 
                    Let's make it rotate WITH it but transition to G? 
                    Let's try counter-rotating to keep 'AG' upright while frame spins.
                */}
                <div className="w-full h-full flex items-center justify-center -rotate-45 transition-all duration-500 group-hover:-rotate-[225deg]">
                    <span className="font-black text-accent text-sm tracking-tighter">AG</span>
                </div>
            </div>

            {/* Text */}
            <div className="flex flex-col leading-none select-none">
                <span className="text-2xl font-black tracking-tighter uppercase group-hover:text-accent transition-colors">Avant-Garde</span>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 group-hover:text-white transition-colors">Enterprise</span>
            </div>
        </div>
    )
}

function Option2() {
    return (
        <div className="group cursor-pointer flex items-center gap-5 perspective-1000">
            {/* 3D Flipping Triangle */}
            <motion.div
                className="w-14 h-14 relative preserve-3d transition-transform duration-700 group-hover:rotate-y-180"
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front: Triangle A */}
                <div className="absolute inset-0 backface-hidden flex items-center justify-center">
                    {/* Triangle Shape using Clip Path */}
                    <div className="w-full h-full bg-accent flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
                        <span className="text-black font-black text-2xl mt-4">A</span>
                    </div>
                </div>

                {/* Back: Triangle G (Flipped) */}
                <div className="absolute inset-0 backface-hidden flex items-center justify-center rotate-y-180 bg-accent" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
                    <span className="text-black font-black text-2xl mt-4">G</span>
                </div>
            </motion.div>

            <div className="flex flex-col leading-none select-none">
                <span className="text-2xl font-black tracking-tighter uppercase group-hover:text-white/50 transition-colors">Avant-Garde</span>
                <div className="overflow-hidden h-4 relative">
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-accent absolute top-0 left-0 transition-transform duration-500 group-hover:-translate-y-full">Enterprise</span>
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-accent absolute top-0 left-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0">Innovation</span>
                </div>
            </div>
        </div>
    )
}


function Option3() {
    return (
        <div className="group cursor-pointer flex items-center gap-4">
            {/* Box that becomes letters */}
            <div className="relative w-12 h-12">
                {/* Background Box */}
                <div className="absolute inset-0 bg-accent transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:scale-125 group-hover:rotate-12" />

                {/* Letter Container */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-black font-black text-2xl transition-all duration-300 group-hover:opacity-0 scale-100">A</span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        <span className="text-black font-black text-xl -translate-x-1">A</span>
                        <span className="text-black font-black text-xl translate-x-1">G</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col leading-none">
                <span className="text-xl font-black tracking-tighter uppercase">Avant-Garde</span>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 group-hover:text-accent transition-colors">Enterprise</span>
            </div>
        </div>
    )
}

function Option4() {
    return (
        <div className="group cursor-pointer flex items-center gap-4">
            {/* The Shape Deconstruction */}
            <div className="w-12 h-12 relative flex items-center justify-center">
                {/* A Diamond that splits */}
                <div className="absolute w-full h-full border-2 border-accent rotate-45 transition-all duration-500 group-hover:rotate-0 group-hover:rounded-full group-hover:border-white/20"></div>

                <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xl overflow-hidden">
                    <div className="flex items-center gap-0.5 transition-transform duration-500 group-hover:gap-3">
                        <span className="text-white group-hover:text-accent transition-colors">A</span>
                        <span className="text-white/20 group-hover:text-accent transition-colors">G</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tighter uppercase">Avant-Garde</span>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-accent opacity-0 -translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0">Enterprise</span>
            </div>
        </div>
    )
}
