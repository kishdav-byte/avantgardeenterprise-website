"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Bot, Cpu, Sparkles, Activity } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase
                .from('bot_config')
                .select('value')
                .eq('key', 'architect_config')
                .maybeSingle()

            const greeting = data?.value?.greeting || "Laying the foundation... I am the Architect. How can I optimize your trajectory today?"
            setMessages([{ role: "assistant", content: greeting }])
        }
        fetchConfig()
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
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
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: "assistant", content: "Error in transmission. Re-establishing link..." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                        className="mb-6 w-[400px] h-[600px] bg-black/95 border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
                    >
                        {/* Chat Header */}
                        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 border border-accent/40 rounded-full flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-accent/20 animate-pulse" />
                                    <Cpu size={18} className="text-accent relative z-10" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-0.5">Protocol: Architect</div>
                                    <div className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        System Active
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === "user" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed uppercase tracking-widest font-bold ${m.role === "user"
                                        ? "bg-white/10 text-white border border-white/10"
                                        : "bg-accent/5 text-accent border border-accent/20 italic"
                                        }`}>
                                        {m.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex gap-2">
                                        {[1, 2, 3].map(j => (
                                            <motion.div
                                                key={j}
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: j * 0.2 }}
                                                className="w-1.5 h-1.5 bg-accent rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Input query for the Architect..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-accent/40 transition-all placeholder:text-white/10"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-accent transition-colors transition-transform active:scale-95"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-6 opacity-20">
                                <div className="flex items-center gap-2 text-[8px] font-black tracking-widest uppercase">
                                    <Activity size={10} /> Sync 0.1ms
                                </div>
                                <div className="flex items-center gap-2 text-[8px] font-black tracking-widest uppercase">
                                    <Sparkles size={10} /> Neural Link
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative group overflow-hidden ${isOpen ? "bg-white text-black" : "bg-accent text-black"
                    }`}
            >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative z-10">
                    {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                </div>

                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black animate-bounce border-2 border-black">
                        1
                    </div>
                )}
            </motion.button>
        </div>
    )
}
