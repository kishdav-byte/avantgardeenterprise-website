"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ContactBot } from "@/components/sections/ContactBot"
import { motion } from "framer-motion"

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-accent selection:text-black">
            <Navbar />

            <section className="pt-48 pb-32 px-4 relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 w-full h-[1000px] bg-accent/5 blur-[150px] pointer-events-none translate-y-[-50%]" />
                <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
                    <span className="text-[15vw] font-black uppercase tracking-tighter italic">CONNECT</span>
                </div>

                <div className="container mx-auto relative z-10">
                    <div className="max-w-4xl mx-auto mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 italic">
                                Establish <span className="text-accent">Contact</span>
                            </h1>
                            <p className="text-white/40 uppercase tracking-[0.4em] text-sm max-w-2xl mx-auto font-bold">
                                Direct connection to the Architect. Neural interface ready for your inquiry.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <ContactBot />
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
