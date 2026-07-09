"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Loader2, Lock, ShieldCheck, ShieldAlert, Search, RefreshCw, 
    TrendingUp, TrendingDown, Bell, Phone, Save, CheckCircle2, 
    ArrowUpRight, AlertOctagon, HelpCircle, ChevronRight, X, Info,
    Sliders
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

interface Trade {
    id: string
    politician_name: string
    chamber: 'House' | 'Senate'
    party: string
    ticker: string
    transaction_type: 'Purchase' | 'Sale' | 'Exchange'
    amount_range: string
    transaction_date: string
    filing_date: string
    committee_overlap: boolean
    is_notified: boolean
    created_at: string
}

interface SimulatedStock {
    ticker: string
    name: string
    price: number
    change: number
    changePercent: number
    prevPrice: number
}

// Initial Simulated Quotes
const INITIAL_STOCKS: SimulatedStock[] = [
    { ticker: 'RTX', name: 'Raytheon Technologies', price: 104.35, change: 1.22, changePercent: 1.18, prevPrice: 104.35 },
    { ticker: 'LMT', name: 'Lockheed Martin', price: 476.80, change: -3.45, changePercent: -0.72, prevPrice: 476.80 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: 421.90, change: 4.85, changePercent: 1.16, prevPrice: 421.90 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 128.20, change: 6.40, changePercent: 5.25, prevPrice: 128.20 },
    { ticker: 'JPM', name: 'JPMorgan Chase', price: 198.50, change: 0.85, changePercent: 0.43, prevPrice: 198.50 },
    { ticker: 'XOM', name: 'Exxon Mobil Corp.', price: 112.15, change: -1.10, changePercent: -0.97, prevPrice: 112.15 },
    { ticker: 'GD', name: 'General Dynamics', price: 292.40, change: 2.10, changePercent: 0.72, prevPrice: 292.40 },
    { ticker: 'AAPL', name: 'Apple Inc.', price: 218.30, change: -0.45, changePercent: -0.21, prevPrice: 218.30 },
];

const MOCK_NEWS_FLASHES = [
    "BREAKING: Senate Armed Services Committee member purchased $50,000 in defense contractor stock (RTX) 3 days before military budget approval.",
    "ALERT: Tech subcommittee representative files sale of $100k in semiconductor shares ahead of import restriction statement.",
    "UPDATE: Energy subcommittee senator files sale of $100k in Chevron (CVX) holdings ahead of emission cap adjustments.",
    "COI FLAG: Representative purchased Financial Services sector stock (JPM) during banking regulations oversight hearings.",
];

export default function CapitolRadarPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any | null>(null)
    
    // Core Data States
    const [trades, setTrades] = useState<Trade[]>([])
    const [originalTrades, setOriginalTrades] = useState<Trade[]>([])
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncMessage, setSyncMessage] = useState<string | null>(null)
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedOverlapFilter, setSelectedOverlapFilter] = useState<'all' | 'overlap'>('all')
    const [selectedChamber, setSelectedChamber] = useState<'all' | 'House' | 'Senate'>('all')
    
    // Interactive Features
    const [newsIndex, setNewsIndex] = useState(0)
    const [showNewsFlash, setShowNewsFlash] = useState(true)
    const [marketQuotes, setMarketQuotes] = useState<SimulatedStock[]>(INITIAL_STOCKS)
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

    // SMS Notifications Form State
    const [smsEnabled, setSmsEnabled] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [settingsSuccess, setSettingsSuccess] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    // Simulated Stock Ticker Updates
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketQuotes(prevQuotes => 
                prevQuotes.map(stock => {
                    const priceVol = stock.price * 0.005; // 0.5% max volatility
                    const changeVal = (Math.random() - 0.49) * priceVol; // slight positive bias
                    const newPrice = Number((stock.price + changeVal).toFixed(2));
                    const totalChange = Number((newPrice - stock.prevPrice).toFixed(2));
                    const pctChange = Number(((totalChange / stock.prevPrice) * 100).toFixed(2));
                    return {
                        ...stock,
                        price: newPrice,
                        change: totalChange,
                        changePercent: pctChange
                    };
                })
            );
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // News Rotator Ticker
    useEffect(() => {
        const newsInterval = setInterval(() => {
            setNewsIndex(prev => (prev + 1) % MOCK_NEWS_FLASHES.length);
        }, 12000);
        return () => clearInterval(newsInterval);
    }, []);

    async function checkAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                setUser(session.user)

                // Get user profile to check admin role
                const { data: profileData } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()

                setProfile(profileData)

                if (profileData && profileData.role === 'admin') {
                    setSmsEnabled(profileData.sms_alerts_enabled || false)
                    setPhoneNumber(profileData.phone_number || '')
                }
            }
        } catch (error) {
            console.error('Auth verification error:', error)
        } finally {
            await fetchTrades()
            setIsLoading(false)
        }
    }

    async function fetchTrades() {
        try {
            const { data, error } = await supabase
                .from('congress_trades')
                .select('*')
                .order('filing_date', { ascending: false })
                .order('transaction_date', { ascending: false })
                .limit(200);

            if (error) throw error;
            if (data) {
                setTrades(data as Trade[]);
                setOriginalTrades(data as Trade[]);
            }
        } catch (err) {
            console.error("Failed to query congress trades:", err);
        }
    }

    async function triggerManualSync() {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const response = await fetch('/api/cron/fetch-trades?trigger=true');
            const data = await response.json();
            if (response.ok && data.success) {
                setSyncMessage(`Sync success! Processed ${data.sync_stats.total_evaluated} entries. Found ${data.sync_stats.overlaps_detected} committee overlaps.`);
                await fetchTrades();
            } else {
                setSyncMessage(`Sync Alert: ${data.error || 'Failed to complete update operations'}`);
            }
        } catch (err) {
            setSyncMessage("Sync Alert: Network request failed.");
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(null), 8000);
        }
    }

    async function saveSMSSettings(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setIsSavingSettings(true);
        setSettingsSuccess(false);

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    sms_alerts_enabled: smsEnabled,
                    phone_number: phoneNumber
                })
                .eq('id', user.id);

            if (error) throw error;
            setSettingsSuccess(true);
            setTimeout(() => setSettingsSuccess(false), 4000);
        } catch (err) {
            console.error("Failed to save SMS alert options:", err);
            alert("Failed to update preferences. Verify database migrations occurred.");
        } finally {
            setIsSavingSettings(false);
        }
    }

    // Handles filtering in state
    useEffect(() => {
        let filtered = [...originalTrades];

        // Search Query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.politician_name.toLowerCase().includes(query) || 
                t.ticker.toLowerCase().includes(query)
            );
        }

        // Chamber Filter
        if (selectedChamber !== 'all') {
            filtered = filtered.filter(t => t.chamber === selectedChamber);
        }

        // Overlap COI Filter
        if (selectedOverlapFilter === 'overlap') {
            filtered = filtered.filter(t => t.committee_overlap === true);
        }

        setTrades(filtered);
    }, [searchQuery, selectedChamber, selectedOverlapFilter, originalTrades]);

    const calculateFilingLatency = (transDate: string, fileDate: string): number => {
        if (!transDate || !fileDate) return 0;
        const trans = new Date(transDate);
        const file = new Date(fileDate);
        const diffTime = Math.abs(file.getTime() - trans.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
                    <p className="text-white/60 text-sm uppercase tracking-widest font-bold">
                        Decrypting Terminal...
                    </p>
                </div>
            </div>
        )
    }

    const isAdmin = profile?.role === 'admin'

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />

            {/* Breaking News Marquee Banner */}
            <AnimatePresence>
                {showNewsFlash && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-24 left-0 right-0 z-40 bg-accent text-background font-bold text-xs uppercase py-3 px-8 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 overflow-hidden w-full">
                            <span className="flex h-2 w-2 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
                            </span>
                            <div className="truncate w-full pr-12">
                                <AnimatePresence mode="wait">
                                    <motion.span 
                                        key={newsIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        FLASH: {MOCK_NEWS_FLASHES[newsIndex]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>
                        <button onClick={() => setShowNewsFlash(false)} className="hover:opacity-60 transition-opacity pl-2 shrink-0">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="border-b border-white/5 bg-black/40 pt-48 pb-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-accent" size={24} />
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30">
                                    COI Active Check
                                </span>
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-500/30">
                                    Tier 1 Intel
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                            <div>
                                <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-4 italic">
                                    CAPITOL <br /> <span className="text-accent">RADAR</span>
                                </h1>
                                <p className="text-white/40 uppercase tracking-[0.4em] text-xs font-black">
                                    Congressional Stock Trade Surveillance Engine // Conflict-of-Interest Scanner
                                </p>
                            </div>

                            {/* Sync Controller Action */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                {isAdmin ? (
                                    <button
                                        onClick={triggerManualSync}
                                        disabled={isSyncing}
                                        className="px-6 py-4 bg-white hover:bg-accent hover:text-black text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-40"
                                    >
                                        {isSyncing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Syncing Feeds...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Trigger Sync Feed
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="px-6 py-4 border border-white/10 bg-white/5 text-white/40 cursor-not-allowed font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3"
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        Admin Required (Sync)
                                    </button>
                                )}
                            </div>
                        </div>

                        {syncMessage && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-white/5 border border-white/10 text-accent font-bold uppercase tracking-wider text-xs flex items-center gap-2"
                            >
                                <Info size={16} />
                                {syncMessage}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* LIVE MARKET QUOTES TICKER (Live Stock Updates) */}
            <div className="border-y border-white/5 bg-white/[0.01] overflow-hidden py-3">
                <div className="container mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2 px-1">
                        <TrendingUp className="text-accent" size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Watchlist Quotes // Live Simulation</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {marketQuotes.map((stock, i) => (
                            <div 
                                key={stock.ticker} 
                                className="bg-[#0e0c15] border border-white/5 rounded-xl p-3 flex flex-col hover:border-accent/30 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-white">{stock.ticker}</span>
                                    <span className={`text-[10px] font-bold flex items-center ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-white/80">
                                    ${stock.price.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                        
                        {/* LEFT COLUMN: FILTERS & THE TRANSACTIONS TABLE */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Filter Bar Panel */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                    {/* Name search field */}
                                    <div className="md:col-span-2 relative">
                                        <input
                                            type="text"
                                            placeholder="Search Politician or Ticker..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none transition-colors"
                                        />
                                        <Search className="absolute left-3.5 top-3.5 text-white/30" size={16} />
                                    </div>

                                    {/* Chamber selection dropdown */}
                                    <div>
                                        <select
                                            value={selectedChamber}
                                            onChange={e => setSelectedChamber(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                                        >
                                            <option value="all">Any Chamber</option>
                                            <option value="House">House</option>
                                            <option value="Senate">Senate</option>
                                        </select>
                                    </div>

                                    {/* COI filter toggle */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedOverlapFilter('all')}
                                            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl border transition-all ${selectedOverlapFilter === 'all' ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white/30 text-white/60'}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setSelectedOverlapFilter('overlap')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-1 ${selectedOverlapFilter === 'overlap' ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 hover:border-white/30 text-white/60'}`}
                                        >
                                            <AlertOctagon size={12} className={selectedOverlapFilter === 'overlap' ? 'text-red-400' : 'opacity-40'} />
                                            COIs Only
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Trades Table List */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white uppercase italic">SURVEILLANCE FEED</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Showing {trades.length} parsed transactions</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent uppercase tracking-widest bg-accent/15 px-3 py-1.5 border border-accent/25 rounded-md">
                                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                                        LIVE SECTORS ACTIVE
                                    </div>
                                </div>

                                {trades.length === 0 ? (
                                    <div className="p-16 text-center text-white/30">
                                        <Sliders className="w-12 h-12 mx-auto mb-4 opacity-25" />
                                        <p className="font-bold uppercase tracking-wider text-sm">No transaction matches</p>
                                        <p className="text-xs uppercase tracking-tight mt-1 opacity-60">Adjust filters or trigger a live sync</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] font-black uppercase text-white/40 tracking-wider">
                                                    <th className="py-4 pl-6">POLITICIAN</th>
                                                    <th className="py-4">TICKER</th>
                                                    <th className="py-4">ACTION</th>
                                                    <th className="py-4">EST. VALUE</th>
                                                    <th className="py-4 text-center">LATENCY</th>
                                                    <th className="py-4 text-center">STATUS</th>
                                                    <th className="py-4 pr-6"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {trades.map((trade) => {
                                                    const latency = calculateFilingLatency(trade.transaction_date, trade.filing_date);
                                                    return (
                                                        <tr 
                                                            key={trade.id} 
                                                            className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${trade.committee_overlap ? 'bg-red-500/[0.01]' : ''}`}
                                                            onClick={() => setSelectedTrade(trade)}
                                                        >
                                                            {/* Politician */}
                                                            <td className="py-4 pl-6">
                                                                <div className="font-bold text-white group-hover:text-accent transition-colors">{trade.politician_name}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[9px] uppercase font-bold text-white/40">{trade.chamber}</span>
                                                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                                    <span className={`text-[9px] uppercase font-black ${trade.party === 'D' ? 'text-blue-400' : trade.party === 'R' ? 'text-red-400' : 'text-purple-400'}`}>
                                                                        Party {trade.party}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Ticker */}
                                                            <td className="py-4">
                                                                <span className="font-mono font-black text-white bg-white/5 px-2.5 py-1 border border-white/5 rounded-md">
                                                                    {trade.ticker}
                                                                </span>
                                                            </td>

                                                            {/* Type */}
                                                            <td className="py-4">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                                                                    trade.transaction_type === 'Purchase' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 
                                                                    trade.transaction_type === 'Sale' ? 'bg-red-500/10 text-red-400 border border-red-500/25' : 
                                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                                                                }`}>
                                                                    {trade.transaction_type}
                                                                </span>
                                                            </td>

                                                            {/* Amount Range */}
                                                            <td className="py-4 font-bold text-white/80 font-mono text-xs">
                                                                {isAdmin ? trade.amount_range : (
                                                                    <span className="text-[10px] text-white/30 tracking-widest font-black">••••••••</span>
                                                                )}
                                                            </td>

                                                            {/* Latency */}
                                                            <td className="py-4 text-center">
                                                                <div className="font-bold font-mono text-white/95">{latency}d</div>
                                                                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Lag Time</div>
                                                            </td>

                                                            {/* COI Overlap Check */}
                                                            <td className="py-4 text-center">
                                                                {trade.committee_overlap ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/30 text-red-500 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">
                                                                        <ShieldAlert size={11} />
                                                                        COI Overlap
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-white/30 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                                                                        Clear
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Chevron trigger */}
                                                            <td className="py-4 pr-6 text-right">
                                                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: SMS SETTINGS & STATISTICS SUMMARY */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* SMS Notifications Preferences Form */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Bell size={80} />
                                </div>

                                <h3 className="text-lg font-bold tracking-tight text-white uppercase italic mb-2">ALERT CONFIGURATION</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Manage SMS triggers for potential COIs</p>

                                {isAdmin ? (
                                    <form onSubmit={saveSMSSettings} className="space-y-4 relative z-10">
                                        {/* Enable toggle */}
                                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <Bell className="text-accent" size={18} />
                                                <div>
                                                    <p className="text-xs font-black uppercase text-white tracking-wider">Instant SMS Signals</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-tight mt-0.5">Alert on high-priority overlaps</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={smsEnabled}
                                                    onChange={e => setSmsEnabled(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                            </label>
                                        </div>

                                        {/* Phone input */}
                                        {smsEnabled && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Failsafe Cell Number (+E.164)</label>
                                                <div className="relative">
                                                    <input
                                                        type="tel"
                                                        placeholder="+15551234567"
                                                        value={phoneNumber}
                                                        onChange={e => setPhoneNumber(e.target.value)}
                                                        required
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                                    />
                                                    <Phone className="absolute left-3.5 top-3.5 text-white/30" size={16} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit action */}
                                        <button
                                            type="submit"
                                            disabled={isSavingSettings}
                                            className="w-full py-4 bg-white hover:bg-accent text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors duration-300 disabled:opacity-40"
                                        >
                                            {isSavingSettings ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save Notifications Prefs
                                        </button>

                                        {/* Settings Save Status toast */}
                                        {settingsSuccess && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={14} />
                                                Alert preferences synced in cloud
                                            </motion.div>
                                        )}
                                    </form>
                                ) : (
                                    <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 text-center py-6">
                                        <Lock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-wider text-white">SMS Signals Restrained</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-tight leading-relaxed mt-1">
                                            Instant text alerts on high-priority overlaps require administrator account privileges.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Analytics Summary Panel */}
                            <div className="bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <h3 className="text-lg font-bold tracking-tight text-white uppercase italic mb-2">METRIC DIRECTIVES</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Database statistics overview</p>

                                <div className="space-y-4">
                                    {[
                                        { 
                                            label: "Active COI Overlaps", 
                                            value: originalTrades.filter(t => t.committee_overlap).length,
                                            sub: "High-priority alarms" 
                                        },
                                        { 
                                            label: "House Transactions", 
                                            value: originalTrades.filter(t => t.chamber === 'House').length,
                                            sub: "Representative disclosures" 
                                        },
                                        { 
                                            label: "Senate Transactions", 
                                            value: originalTrades.filter(t => t.chamber === 'Senate').length,
                                            sub: "Senator disclosures" 
                                        },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-white/60 tracking-wider">{stat.label}</p>
                                                <p className="text-[9px] text-white/30 uppercase tracking-tight mt-0.5">{stat.sub}</p>
                                            </div>
                                            <div className="text-2xl font-black text-white font-mono">
                                                {stat.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal Detail Overlay */}
            <AnimatePresence>
                {selectedTrade && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedTrade(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0b0a0e] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative overflow-hidden"
                        >
                            {/* Close Trigger */}
                            <button 
                                onClick={() => setSelectedTrade(null)}
                                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Modal Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <AlertOctagon className={`w-8 h-8 ${selectedTrade.committee_overlap ? 'text-red-500' : 'text-accent'}`} />
                                <div>
                                    <h4 className="text-xl font-bold text-white uppercase italic">CONFLICT METRIC DEBRIEF</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Trade ID: {selectedTrade.id.slice(0, 8)}...</p>
                                </div>
                            </div>

                            {/* Details Lists */}
                            <div className="space-y-4">
                                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">POLITICIAN Intel</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Name</p>
                                            <p className="text-sm font-black text-accent mt-0.5">{selectedTrade.politician_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Chamber</p>
                                            <p className="text-sm font-black text-white mt-0.5">{selectedTrade.chamber} ({selectedTrade.party === 'D' ? 'Democrat' : selectedTrade.party === 'R' ? 'Republican' : 'Independent'})</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-3">TRANSACTION Intel</p>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Ticker</p>
                                            <p className="text-sm font-mono font-black text-white mt-0.5">{selectedTrade.ticker}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Action</p>
                                            <p className="text-sm font-black text-white mt-0.5">{selectedTrade.transaction_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Estimated Value</p>
                                            <p className="text-sm font-black text-white mt-0.5">
                                                {isAdmin ? selectedTrade.amount_range : "•••••••• (Admin Key Req)"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">Filing Lag</p>
                                            <p className="text-sm font-black text-white mt-0.5">{calculateFilingLatency(selectedTrade.transaction_date, selectedTrade.filing_date)} Days</p>
                                        </div>
                                    </div>
                                </div>

                                {/* COI Alignment Summary Details */}
                                {isAdmin ? (
                                    selectedTrade.committee_overlap ? (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-red-400 tracking-widest mb-2 flex items-center gap-1">
                                                <Info size={11} />
                                                Conflict-of-Interest OVERLAP DETECTED
                                            </p>
                                            <p className="text-xs text-white/80 leading-relaxed uppercase font-semibold">
                                                {selectedTrade.politician_name} is assigned to a legislative committee overseeing industries directly tied to {selectedTrade.ticker}. This trade matches conflict-of-interest criteria.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                            <p className="text-[9px] font-black uppercase text-white/60 tracking-widest mb-2">COI Status Clear</p>
                                            <p className="text-xs text-white/50 leading-relaxed uppercase font-semibold">
                                                No explicit committee overlap assignments found. Sector and ticker trade is cleared under standard screening protocols.
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 text-center py-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
                                        <Lock size={20} className="text-white/20 mx-auto mb-2 relative z-10" />
                                        <p className="text-[10px] font-black uppercase text-white/60 tracking-widest relative z-10 mb-1">COI Mapping Locked</p>
                                        <p className="text-[9px] text-white/40 leading-relaxed uppercase font-bold max-w-sm mx-auto relative z-10">
                                            Specific legislative committee mapping logs and sector overlaps require administrator privilege elevation keys.
                                        </p>
                                    </div>
                                )}

                                <div className="text-right">
                                    <button 
                                        onClick={() => setSelectedTrade(null)}
                                        className="px-6 py-3 border border-white/10 hover:border-white text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                                    >
                                        Close Intel Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    )
}
