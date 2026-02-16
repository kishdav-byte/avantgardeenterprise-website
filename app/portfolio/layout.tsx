import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Portfolio | Avant-Garde Enterprise',
    description: 'Explore our selected works and case studies in AI engineering, digital transformation, and innovation.',
    alternates: {
        canonical: '/portfolio',
    },
}

export default function PortfolioLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
