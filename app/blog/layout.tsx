import { Metadata } from "next"

export const metadata: Metadata = {
    title: "The Intel | Avant-Garde Enterprise",
    description: "Insights, strategy, and future-proofing from the Avant-Garde team. Explore our latest thoughts on AI, innovation, and digital transformation.",
    alternates: {
        canonical: '/blog',
    },
}

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
