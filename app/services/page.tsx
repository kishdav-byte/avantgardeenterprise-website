import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Services } from "@/components/sections/Services"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Services | Avant-Garde Enterprise",
    description: "Explore our strategic digital services, from AI implementation to enterprise digital transformation. We help forward-thinking companies scale with precision.",
    alternates: {
        canonical: '/services',
    },
}

export default function ServicesPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32">
                <Services />
            </div>
            <Footer />
        </main>
    )
}
