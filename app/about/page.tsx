import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { About } from "@/components/sections/About"

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
