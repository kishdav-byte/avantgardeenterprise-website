import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login | Avant-Garde Enterprise',
    description: 'Access your Avant-Garde Enterprise dashboard and intelligent tools.',
    alternates: {
        canonical: '/login',
    },
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
