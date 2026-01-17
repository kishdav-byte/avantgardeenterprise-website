import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Services } from "@/components/sections/Services"

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
