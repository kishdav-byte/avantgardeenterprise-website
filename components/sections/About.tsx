"use client"

import { motion } from "framer-motion"

export function About() {
    return (
        <section id="about" className="py-24 border-t border-white/5">
            <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 leading-tight">
                        WE ARE A <span className="text-accent">COLLECTIVE</span> OF VISIONARIES.
                    </h2>
                    <p className="text-lg text-white/70 mb-6 leading-relaxed">
                        Avant-Garde isn&apos;t just our name—it&apos;s our operating model. Our mission is simple: <strong className="text-white">We replace manual bottlenecks with intelligent automation, custom tools, and streamlined operational workflows.</strong>
                    </p>
                    <p className="text-lg text-white/70 leading-relaxed mb-6">
                        We are shifting the paradigm by offering our powerful tools directly to users. Secure your <strong className="text-accent">AI Assistant Access</strong> today, or experience specialized engineering with products like the <strong className="text-accent">Total Package Interview</strong> app.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative h-[400px] bg-white/5 border border-white/10 flex items-center justify-center p-8 text-center overflow-hidden"
                >
                    {/* Decorative abstract elements */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none" />
                    <div className="text-[12rem] font-bold opacity-5 select-none text-white leading-none tracking-tighter absolute -left-10 top-0">AI</div>
                    <div className="absolute bottom-8 right-8 text-right z-10">
                        <div className="text-4xl font-black text-accent tracking-tighter">ACCESS</div>
                        <div className="text-sm uppercase tracking-widest text-white/50">INTELLIGENT TOOLS</div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-xl font-bold uppercase tracking-widest text-white mb-2">NOW AVAILABLE</div>
                        <div className="w-12 h-1 bg-accent mx-auto" />
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
