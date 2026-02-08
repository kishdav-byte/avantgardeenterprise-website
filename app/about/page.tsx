import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { About } from "@/components/sections/About"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "About | Avant-Garde Enterprise",
    description: "Learn about the mission and team behind Avant-Garde Enterprise. We are redefining the future with bold innovation and strategic digital solutions.",
    alternates: {
        canonical: '/about',
    },
}

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32">
                <About />
            </div>
            <Footer />
        </main>
    )
}
