"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { SpacePlannerHeader } from "@/components/space-planner/SpacePlannerHeader"
import { AuditWizard } from "@/components/space-planner/AuditWizard"

export default function NewSpaceAuditPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-24">
                <SpacePlannerHeader backHref="/tools/space-planner" backLabel="Overview" />

                <section className="py-12 px-4 relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent/5 blur-[120px] pointer-events-none rounded-full" />

                    <div className="container mx-auto max-w-5xl relative z-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                                New Space <span className="text-accent">Audit</span>
                            </h1>
                            <p className="text-white/50 text-xs md:text-sm uppercase tracking-widest font-bold">
                                Multimodal Room Analysis & Phased Transformation Roadmap
                            </p>
                        </div>

                        <AuditWizard />
                    </div>
                </section>
            </div>
            <Footer />
        </main>
    )
}
