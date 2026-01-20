"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Cpu, Activity, Sparkles, User, Mail, CheckCircle2 } from "lucide-react"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function ContactBot() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Protocol initiated. I am the Architect. Before we establish a deep-link for your inquiry, may I have your name and professional email?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    // Lead capture state
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [step, setStep] = useState<'info' | 'message'>('info')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    useEffect(scrollToBottom, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading || isComplete) return

        const userMsg = input.trim()
        setMessages(prev => [...prev, { role: "user", content: userMsg }])
        setInput("")

        if (step === 'info') {
            // Simple logic: if it has an @, assume it's the email part
            if (userMsg.includes('@')) {
                setEmail(userMsg)
                // If we don't have a name yet, try to extract it or just ask for it later
                // For now, let's just move to message
                setStep('message')
                setMessages(prev => [...prev, { role: "assistant", content: `Thank you. Signal locked. What mission or project would you like to discuss?` }])
            } else {
                setName(userMsg)
                setMessages(prev => [...prev, { role: "assistant", content: `Confirmed, ${userMsg}. Now, provide your professional email to authorize the transmission.` }])
            }
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, { role: "user", content: userMsg }] }),
            })

            if (!response.body) throw new Error("No response body")
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantMsg = ""

            setMessages(prev => [...prev, { role: "assistant", content: "" }])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                assistantMsg += chunk
                setMessages(prev => {
                    const last = prev[prev.length - 1]
                    const rest = prev.slice(0, -1)
                    return [...rest, { ...last, content: assistantMsg }]
                })
            }

            // Check if user is asking to "send" or "submit"
            if (userMsg.toLowerCase().includes("send") || userMsg.toLowerCase().includes("submit") || assistantMsg.length > 100) {
                // Auto-capture after a substantial exchange or explicit request
                await finalizeLead(assistantMsg)
            }

        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const finalizeLead = async (lastMsg: string) => {
        if (!email) return

        try {
            await fetch("/api/contact/bot-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name || 'Anonymous Architect Lead',
                    email,
                    message: messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
                }),
            })
            setIsComplete(true)
            setMessages(prev => [...prev, { role: "assistant", content: "Signal archived. The Architect has logged your inquiry. We will respond shortly." }])
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[48px] overflow-hidden flex flex-col h-[700px] shadow-2xl backdrop-blur-3xl relative">
            {/* Header */}
            <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 border border-accent/40 rounded-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/20 animate-pulse" />
                        <Cpu size={24} className="text-accent relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-widest italic text-accent">Protocol: Architect</h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            <Activity size={12} className="text-green-500 animate-pulse" /> Direct Intelligence Link // Active
                        </div>
                    </div>
                </div>
                {isComplete && (
                    <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full border border-accent/20">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest tracking-widest">Signal Locked</span>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide bg-[radial-gradient(circle_at_center,rgba(204,255,0,0.03)_0%,transparent_100%)]">
                {messages.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[80%] p-6 rounded-3xl text-sm leading-relaxed border ${m.role === "user"
                            ? "bg-white/10 text-white border-white/10"
                            : "bg-accent/5 text-accent border-accent/20 font-bold italic"
                            }`}>
                            {m.content}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl flex gap-2">
                            {[1, 2, 3].map(j => (
                                <motion.div
                                    key={j}
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: j * 0.2 }}
                                    className="w-2 h-2 bg-accent rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-10 border-t border-white/10 bg-white/[0.01]">
                {isComplete ? (
                    <div className="text-center py-4">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Transmission Complete // Architect Sync Success</p>
                    </div>
                ) : (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-accent/10 rounded-[24px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder={step === 'info' ? "Enter your name or email..." : "Speak to the Architect..."}
                            className="w-full relative z-10 bg-white/5 border border-white/10 rounded-[24px] px-8 py-6 text-sm font-bold placeholder:text-white/10 outline-none focus:border-accent/40 transition-all text-white pr-20"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-accent transition-all active:scale-95 shadow-xl z-20"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                )}
                <div className="mt-8 flex items-center justify-center gap-10 opacity-10">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><User size={12} /> Biometric ID: {name || 'Pending'}</div>
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><Mail size={12} /> Comms: {email || 'Pending'}</div>
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"><Sparkles size={12} /> Neural Link 1.0</div>
                </div>
            </div>
        </div>
    )
}
