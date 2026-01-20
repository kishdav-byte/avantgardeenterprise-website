import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Hero } from "@/components/sections/Hero"
import { Services } from "@/components/sections/Services"
import { About } from "@/components/sections/About"
import { ContactForm } from "@/components/sections/ContactForm"
import { NewsletterPopup } from "@/components/NewsletterPopup"
import { ProductShowcase } from "@/components/sections/ProductShowcase"

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
