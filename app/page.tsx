import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Hero } from "@/components/sections/Hero"
import { NewsletterPopup } from "@/components/NewsletterPopup"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <Navbar />
      <Hero />
      <NewsletterPopup />
      <Footer />
    </main>
  )
}
