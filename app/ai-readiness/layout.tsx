import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AI Readiness Assessment | Avant-Garde Enterprise',
    description: 'Determine your organization\'s readiness for AI implementation with our comprehensive assessment tool.',
    alternates: {
        canonical: '/ai-readiness',
    },
}

export default function AIReadinessLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
