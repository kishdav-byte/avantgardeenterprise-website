"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Bot, Cpu, Sparkles, Activity } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant"
    content: string
}

export function ChatBot() {
    const pathname = usePathname()
    const isK9 = pathname?.includes("/product/k9-training")
    const botType = isK9 ? "pawgress" : "architect"
    const botConfigKey = isK9 ? "pawgress_config" : "architect_config"

    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Reset messages when switching bot context
    useEffect(() => {
        setMessages([
            {
                role: "assistant",
                content: isK9
                    ? "Pawgress AI is online. How can I assist with your dog's training today?"
                    : "Laying the foundation... I am the Architect. How can I optimize your trajectory today?"
            }
        ])
    }, [isK9])

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase
                .from('bot_config')
                .select('value')
                .eq('key', botConfigKey)
                .maybeSingle()

            if (data?.value?.greeting) {
                setMessages(prev => {
                    if (prev.length === 1 && prev[0].role === 'assistant') {
                        return [{ role: "assistant", content: data.value.greeting }]
                    }
                    return prev
                })
            }
        }
        fetchConfig()
    }, [botConfigKey])

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
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    botType
                }),
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
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                        className="mb-4 md:mb-6 w-[calc(100vw-2rem)] md:w-[400px] h-[70vh] md:h-[600px] bg-black/95 border border-white/10 rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
                    >
                        {/* Chat Header */}
                        <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 border rounded-full flex items-center justify-center relative overflow-hidden group",
                                    isK9 ? "border-[#FF6B00]/40" : "border-accent/40"
                                )}>
                                    <div className={cn(
                                        "absolute inset-0 animate-pulse",
                                        isK9 ? "bg-[#FF6B00]/20" : "bg-accent/20"
                                    )} />
                                    {isK9 ? (
                                        <Bot size={18} className="text-[#FF6B00] relative z-10" />
                                    ) : (
                                        <Cpu size={18} className="text-accent relative z-10" />
                                    )}
                                </div>
                                <div>
                                    <div className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.3em] mb-0.5",
                                        isK9 ? "text-[#FF6B00]" : "text-accent"
                                    )}>Protocol: {isK9 ? "Pawgress AI" : "Architect"}</div>
                                    <div className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                            isK9 ? "bg-[#FF6B00]" : "bg-green-500"
                                        )} />
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
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === "user" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={cn(
                                        "max-w-[85%] p-3 md:p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs leading-relaxed uppercase tracking-widest font-bold",
                                        m.role === "user"
                                            ? "bg-white/10 text-white border border-white/10"
                                            : isK9
                                                ? "bg-[#FF6B00]/5 text-[#FF6B00] border border-[#FF6B00]/20 italic"
                                                : "bg-accent/5 text-accent border border-accent/20 italic"
                                    )}>
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
                        <div className="p-4 md:p-6 border-t border-white/10 bg-white/[0.02]">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder={isK9 ? "Query Pawgress Expert..." : "Input query for the Architect..."}
                                    className={cn(
                                        "w-full relative z-10 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none transition-all placeholder:text-white/10",
                                        isK9 ? "focus:border-[#FF6B00]/40" : "focus:border-accent/40"
                                    )}
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-accent transition-colors transition-transform active:scale-95 z-20"
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
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative group overflow-hidden",
                    isOpen ? "bg-white text-black" : isK9 ? "bg-[#FF6B00] text-white" : "bg-accent text-black"
                )}
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
