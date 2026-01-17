"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"

const projects = [
    { title: "Neuro-Sync Platform", category: "AI Engineering", year: "2024" },
    { title: "Vortex Data Engine", category: "Big Data", year: "2023" },
    { title: "Lumina Interface", category: "UX/UI Design", year: "2024" },
    { title: "Ghost Protocol Security", category: "Cybersecurity", year: "2023" },
]

export default function PortfolioPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-40 pb-20 px-4">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-20 text-center"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6">
                            Selected <span className="text-accent">Works</span>
                        </h1>
                        <p className="text-white/40 uppercase tracking-[0.4em] text-sm">Case Studies // Innovation // 001</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative aspect-video bg-white/5 border border-white/10 p-8 flex flex-col justify-end overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <p className="text-accent text-xs font-bold tracking-widest uppercase mb-2">{project.category}</p>
                                    <h3 className="text-3xl font-bold uppercase tracking-tighter group-hover:text-accent transition-colors">{project.title}</h3>
                                    <p className="text-white/20 text-xs mt-4 uppercase tracking-widest">— {project.year}</p>
                                </div>
                                <div className="absolute top-8 right-8 w-12 h-12 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <span className="text-xl">↗</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-20 py-20 border-t border-white/5 text-center">
                        <p className="text-white/30 text-sm uppercase tracking-[0.2em]">More projects coming soon...</p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
