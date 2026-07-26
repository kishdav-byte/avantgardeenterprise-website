"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Cpu, 
    Activity, 
    Sparkles, 
    User, 
    Mail, 
    CheckCircle2, 
    Settings, 
    Bell, 
    Phone, 
    Save, 
    Loader2, 
    ChevronRight,
    Search
} from "lucide-react"

interface Callback {
    id: string
    timestamp: string
    name: string
    phone: string
    email?: string
    request_type: string
    preferred_time: string
    status: "pending" | "contacted"
    notes?: string
}

interface ReceptionistSettings {
    voice: string
    instructions: string
    greeting: string
    enable_email_notifications: boolean
    notification_email?: string
    sendgrid_api_key?: string
    enable_sms_notifications: boolean
    notification_phone?: string
}

export function AIReceptionist() {
    const [activeTab, setActiveTab] = useState<"settings" | "notifications" | "callbacks">("settings")
    const [settings, setSettings] = useState<ReceptionistSettings>({
        voice: "Aoede",
        instructions: "",
        greeting: "",
        enable_email_notifications: false,
        notification_email: "",
        sendgrid_api_key: "",
        enable_sms_notifications: false,
        notification_phone: ""
    })
    const [callbacks, setCallbacks] = useState<Callback[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
    const [selectedCallback, setSelectedCallback] = useState<Callback | null>(null)
    const [callbackFilter, setCallbackFilter] = useState<"all" | "pending" | "contacted">("all")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const settingsRes = await fetch("/api/admin/receptionist/settings")
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json()
                setSettings(settingsData)
            }

            const callbacksRes = await fetch("/api/admin/receptionist/callbacks")
            if (callbacksRes.ok) {
                const callbacksData = await callbacksRes.json()
                setCallbacks(callbacksData.callbacks || [])
            }
        } catch (err) {
            console.error("Failed to load receptionist data:", err)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSaveSettings(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)
        setStatusMessage(null)

        try {
            const res = await fetch("/api/admin/receptionist/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            })

            if (res.ok) {
                setStatusMessage({ text: "AI Settings saved successfully!", type: "success" })
            } else {
                setStatusMessage({ text: "Failed to save AI Settings.", type: "error" })
            }
        } catch (err) {
            console.error(err)
            setStatusMessage({ text: "Network error saving settings.", type: "error" })
        } finally {
            setIsSaving(false)
        }
    }

    async function markCallbackContacted(id: string) {
        try {
            const res = await fetch(`/api/admin/receptionist/callbacks/${id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "contacted" })
            })

            if (res.ok) {
                setCallbacks(prev => prev.map(cb => cb.id === id ? { ...cb, status: "contacted" } : cb))
                if (selectedCallback && selectedCallback.id === id) {
                    setSelectedCallback(prev => prev ? { ...prev, status: "contacted" } : null)
                }
            }
        } catch (err) {
            console.error("Failed to mark callback as contacted:", err)
        }
    }

    const filteredCallbacks = callbacks.filter(cb => {
        if (callbackFilter === "all") return true
        return cb.status === callbackFilter
    })

    const pendingCount = callbacks.filter(cb => cb.status === "pending").length

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
                    <p className="text-white/40 uppercase tracking-widest text-[10px] font-black">Syncing Core Settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-accent/40 rounded-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/20 animate-pulse" />
                        <Cpu size={20} className="text-accent relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-white">ALBA Reception Engine</h3>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            <Activity size={10} className="text-green-500 animate-pulse" /> Direct Connection State // Active
                        </div>
                    </div>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full border border-amber-500/20">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{pendingCount} Pending Callbacks</span>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 gap-6">
                {[
                    { id: "settings", label: "AI Settings", icon: <Settings size={16} /> },
                    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
                    { id: "callbacks", label: "Callbacks", icon: <Phone size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any)
                            setStatusMessage(null)
                        }}
                        className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest transition-all relative outline-none ${
                            activeTab === tab.id ? "text-accent" : "text-white/40 hover:text-white"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.id === "callbacks" && pendingCount > 0 && (
                            <span className="ml-1 bg-amber-500 text-black text-[9px] font-black rounded-full px-2 py-0.5">
                                {pendingCount}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabBorder"
                                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                        <motion.form
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleSaveSettings}
                            className="space-y-6 bg-white/[0.01] border border-white/5 p-8 rounded-3xl backdrop-blur-xl"
                        >
                            {/* Voice Selection */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40">Voice Persona</label>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {[
                                        { name: "Puck", desc: "Playful & Energetic (Male)" },
                                        { name: "Charon", desc: "Deep & Authoritative (Male)" },
                                        { name: "Kore", desc: "Calm & Soothing (Female)" },
                                        { name: "Fenrir", desc: "Resonant & Strong (Male)" },
                                        { name: "Aoede", desc: "Expressive & Bright (Female)" }
                                    ].map(voiceOption => (
                                        <label key={voiceOption.name} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="voice"
                                                value={voiceOption.name}
                                                checked={settings.voice === voiceOption.name}
                                                onChange={() => setSettings(prev => ({ ...prev, voice: voiceOption.name }))}
                                                className="peer sr-only"
                                            />
                                            <div className="p-4 h-full rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] peer-checked:border-accent/40 peer-checked:bg-accent/5 transition-all flex flex-col justify-between">
                                                <span className="block text-xs font-bold text-white uppercase tracking-wider">{voiceOption.name}</span>
                                                <span className="block text-[9px] text-white/40 uppercase font-medium mt-2">{voiceOption.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Knowledge Base */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40">Knowledge Base & Instructions</label>
                                <textarea
                                    value={settings.instructions}
                                    onChange={(e) => setSettings(prev => ({ ...prev, instructions: e.target.value }))}
                                    rows={8}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white text-xs leading-relaxed uppercase tracking-wider font-bold placeholder:text-white/10 focus:border-accent/40 outline-none transition-all resize-none"
                                    placeholder="Define your receptionist's guidelines and knowledge injects..."
                                />
                            </div>

                            {/* Greeting */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40">Initial Greeting</label>
                                <textarea
                                    value={settings.greeting}
                                    onChange={(e) => setSettings(prev => ({ ...prev, greeting: e.target.value }))}
                                    rows={3}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white text-xs leading-relaxed uppercase tracking-wider font-bold placeholder:text-white/10 focus:border-accent/40 outline-none transition-all resize-none"
                                    placeholder="Enter the phrase ALBA says when answering..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div>
                                    {statusMessage && (
                                        <p className={`text-xs font-bold uppercase tracking-wider ${
                                            statusMessage.type === "success" ? "text-green-400 animate-pulse" : "text-red-400"
                                        }`}>
                                            {statusMessage.text}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Config
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <motion.form
                            key="notifications"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleSaveSettings}
                            className="space-y-8 bg-white/[0.01] border border-white/5 p-8 rounded-3xl backdrop-blur-xl"
                        >
                            {/* Email Settings */}
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        id="enable_email_notifications"
                                        checked={settings.enable_email_notifications}
                                        onChange={(e) => setSettings(prev => ({ ...prev, enable_email_notifications: e.target.checked }))}
                                        className="w-5 h-5 accent-accent border border-white/20 rounded"
                                    />
                                    <label htmlFor="enable_email_notifications" className="text-sm font-bold uppercase tracking-widest text-white cursor-pointer select-none">
                                        Enable Email Notifications
                                    </label>
                                </div>

                                {settings.enable_email_notifications && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-4 pl-9"
                                    >
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40">Notification Email Address</label>
                                            <input
                                                type="email"
                                                value={settings.notification_email}
                                                onChange={(e) => setSettings(prev => ({ ...prev, notification_email: e.target.value }))}
                                                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-accent/40 outline-none transition-all"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40">SendGrid API Key</label>
                                            <input
                                                type="password"
                                                value={settings.sendgrid_api_key}
                                                onChange={(e) => setSettings(prev => ({ ...prev, sendgrid_api_key: e.target.value }))}
                                                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-accent/40 outline-none transition-all"
                                                placeholder="SG.xxxxxxxxxxxxxxxx"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* SMS Settings */}
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        id="enable_sms_notifications"
                                        checked={settings.enable_sms_notifications}
                                        onChange={(e) => setSettings(prev => ({ ...prev, enable_sms_notifications: e.target.checked }))}
                                        className="w-5 h-5 accent-accent border border-white/20 rounded"
                                    />
                                    <label htmlFor="enable_sms_notifications" className="text-sm font-bold uppercase tracking-widest text-white cursor-pointer select-none">
                                        Enable SMS Notifications
                                    </label>
                                </div>

                                {settings.enable_sms_notifications && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-2 pl-9"
                                    >
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40">Notification Phone Number</label>
                                        <input
                                            type="tel"
                                            value={settings.notification_phone}
                                            onChange={(e) => setSettings(prev => ({ ...prev, notification_phone: e.target.value }))}
                                            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:border-accent/40 outline-none transition-all"
                                            placeholder="+1864XXXXXXX"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div>
                                    {statusMessage && (
                                        <p className={`text-xs font-bold uppercase tracking-wider ${
                                            statusMessage.type === "success" ? "text-green-400 animate-pulse" : "text-red-400"
                                        }`}>
                                            {statusMessage.text}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Notification Config
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* Callbacks Tab */}
                    {activeTab === "callbacks" && (
                        <motion.div
                            key="callbacks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Filter bar */}
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {(["all", "pending", "contacted"] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setCallbackFilter(filter)}
                                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all rounded-full ${
                                                callbackFilter === filter
                                                    ? "bg-accent text-black border-accent"
                                                    : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white"
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Callbacks Table */}
                            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-white/40">Timestamp</th>
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-white/40">Name</th>
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-white/40">Phone</th>
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-white/40">Preferred Time</th>
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-white/40">Type</th>
                                                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-white/40">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCallbacks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center p-12 text-xs font-bold text-white/20 uppercase tracking-widest">
                                                        No callback records located
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredCallbacks.map(callback => (
                                                    <tr
                                                        key={callback.id}
                                                        onClick={() => setSelectedCallback(callback)}
                                                        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all"
                                                    >
                                                        <td className="p-4 text-xs font-bold text-white/60">
                                                            {new Date(callback.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="p-4 text-xs font-black text-white">{callback.name}</td>
                                                        <td className="p-4 text-xs font-bold text-white/60">{callback.phone}</td>
                                                        <td className="p-4 text-xs font-bold text-white/60">{callback.preferred_time}</td>
                                                        <td className="p-4 text-xs font-bold text-accent/80">{callback.request_type}</td>
                                                        <td className="p-4">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                                callback.status === "pending"
                                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                                    : "bg-green-500/10 text-green-400 border-green-500/20"
                                                            }`}>
                                                                {callback.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedCallback && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCallback(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-black border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative z-10 shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">Callback dossier</h3>
                                <button
                                    onClick={() => setSelectedCallback(null)}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Client Name</span>
                                    <p className="text-sm font-black text-white">{selectedCallback.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Phone Connection</span>
                                    <p className="text-sm font-bold text-accent">{selectedCallback.phone}</p>
                                </div>
                                <div className="space-y-1 col-span-1 md:col-span-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Email Coordinates</span>
                                    <p className="text-sm font-bold text-white/60">{selectedCallback.email || "Not Provided"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Request Classification</span>
                                    <p className="text-sm font-bold text-white">{selectedCallback.request_type}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Preferred Windows</span>
                                    <p className="text-sm font-bold text-white">{selectedCallback.preferred_time}</p>
                                </div>
                                <div className="space-y-1 col-span-1 md:col-span-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Biometric / Contextual Notes</span>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-xs text-white/80 font-bold uppercase tracking-wider leading-relaxed whitespace-pre-line italic">
                                        {selectedCallback.notes || "No additional context injected."}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                                {selectedCallback.status === "pending" ? (
                                    <button
                                        onClick={() => markCallbackContacted(selectedCallback.id)}
                                        className="px-6 py-3 bg-accent text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={14} />
                                        Mark Contacted
                                    </button>
                                ) : (
                                    <span className="px-4 py-2 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-wider border border-green-500/20 rounded-full">
                                        Contact Completed
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
