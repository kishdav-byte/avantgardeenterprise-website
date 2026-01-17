"use client"

import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'

export default function TestAuthPage() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSignUp = async () => {
        setMessage('')
        setError('')

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: 'TestPassword123!',
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            })

            if (error) {
                setError(`Error: ${error.message}`)
            } else {
                setMessage(`Success! Check your email (${email}). User ID: ${data.user?.id || 'pending'}`)
            }
        } catch (err: any) {
            setError(`Exception: ${err.message}`)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🔧 Supabase Auth Test</h1>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-4">
                    <p className="text-sm mb-4">Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                    <p className="text-sm mb-4">Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <input
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 mb-4 text-white"
                    />
                    <button
                        onClick={handleSignUp}
                        className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200"
                    >
                        Test Sign Up
                    </button>

                    {message && (
                        <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded text-green-300">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-300">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
