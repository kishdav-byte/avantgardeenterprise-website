import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Pawgress AI | Avant-Garde Enterprise',
    description: 'AI-powered dog training Micro-SaaS. Generate dynamic 30-day training regimens tailored to your specific goals.',
}

export default function K9Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
