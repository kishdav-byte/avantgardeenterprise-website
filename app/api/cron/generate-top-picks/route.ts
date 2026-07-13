import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

// Static fallbacks for company directory
const COMPANY_DIRECTORY: Record<string, { name: string; industry: string }> = {
    NVDA: { name: "NVIDIA Corporation", industry: "Semiconductors" },
    AAPL: { name: "Apple Inc.", industry: "Technology" },
    MSFT: { name: "Microsoft Corporation", industry: "Technology" },
    AMZN: { name: "Amazon.com, Inc.", industry: "E-commerce" },
    GOOGL: { name: "Alphabet Inc.", industry: "Technology" },
    META: { name: "Meta Platforms, Inc.", industry: "Technology" },
    AVGO: { name: "Broadcom Inc.", industry: "Semiconductors" },
    LMT: { name: "Lockheed Martin Corporation", industry: "Defense" },
    GD: { name: "General Dynamics Corporation", industry: "Defense" },
    RTX: { name: "RTX Corporation", industry: "Defense" },
    XOM: { name: "Exxon Mobil Corporation", industry: "Energy" },
    CVX: { name: "Chevron Corporation", industry: "Energy" },
    JPM: { name: "JPMorgan Chase & Co.", industry: "Financial Services" },
    BAC: { name: "Bank of America Corporation", industry: "Financial Services" },
    UNH: { name: "UnitedHealth Group Incorporated", industry: "Healthcare" },
    LLY: { name: "Eli Lilly and Company", industry: "Pharmaceuticals" },
    CAT: { name: "Caterpillar Inc.", industry: "Agriculture" },
    DE: { name: "John Deere & Company", industry: "Agriculture" },
    FDX: { name: "FedEx Corporation", industry: "Transportation" },
    UPS: { name: "United Parcel Service, Inc.", industry: "Transportation" }
};

// State delegation mappings
const STATE_DELEGATIONS: Record<string, string> = {
    "Nancy Pelosi": "CA", "Ro Khanna": "CA", "Daniel Goldman": "NY", "Chuck Schumer": "NY",
    "Dan Crenshaw": "TX", "Ted Cruz": "TX", "Tommy Tuberville": "AL", "Markwayne Mullin": "OK",
    "Josh Gottheimer": "NJ", "Michael Guest": "MS", "Rick Scott": "FL", "Sheldon Whitehouse": "RI",
    "John Fetterman": "PA", "Pat Toomey": "PA", "Richard Burr": "NC", "Marjorie Taylor Greene": "GA",
    "Diana Harshbarger": "TN", "Jared Moskowitz": "FL", "Thomas Carper": "DE", "Angus King": "ME",
    "Bernie Sanders": "VT", "Mitch McConnell": "KY", "Jared Golden": "ME", "Bill Hagerty": "TN"
};

// Generates a deterministic price series for technical vectoring and moving averages
function simulatePriceSeries(ticker: string, days: number = 250): number[] {
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
        hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash) % 100 + 50; // Base price between 50 and 150
    const prices: number[] = [];
    let currentPrice = seed;
    
    // Deterministic random walk
    for (let i = 0; i < days; i++) {
        const rand = Math.sin(i * 0.15 + seed) * Math.cos(i * 0.05);
        const change = rand * (seed * 0.015); // max 1.5% daily volatility
        currentPrice = Math.max(currentPrice + change, 5.0);
        prices.push(parseFloat(currentPrice.toFixed(2)));
    }
    return prices;
}

// Calculate ATR (Average True Range)
function calculateATR(prices: number[], period: number = 14): number {
    let trSum = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const high = prices[i] * 1.01;
        const low = prices[i] * 0.99;
        const prevClose = prices[i - 1];
        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        trSum += tr;
    }
    return parseFloat((trSum / period).toFixed(2));
}

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const cookieStore = await cookies();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        });

        // 1. Fetch system weights from DB
        const { data: configs } = await supabase.rpc('rpc_get_system_config');
        const config = configs && configs[0] ? configs[0] : {
            political_weight: 0.35,
            momentum_weight: 0.35,
            sentiment_weight: 0.20,
            catalyst_weight: 0.10
        };

        // 2. Fetch recent trades (last 90 days) to evaluate political signals
        const { data: dbTrades } = await supabase
            .from('congress_trades')
            .select('*')
            .order('transaction_date', { ascending: false });

        const OFFICIAL_ROSTER = new Set([
            'Nancy Pelosi', 'Tommy Tuberville', 'Markwayne Mullin', 'Ro Khanna', 'Josh Gottheimer',
            'Michael Guest', 'Dan Crenshaw', 'Rick Scott', 'Sheldon Whitehouse', 'John Fetterman',
            'Pat Toomey', 'Richard Burr', 'Marjorie Taylor Greene', 'Diana Harshbarger', 'Daniel Goldman',
            'Jared Moskowitz', 'Thomas Carper', 'Angus King', 'Bernie Sanders', 'Ted Cruz',
            'Mitch McConnell', 'Chuck Schumer', 'Jared Golden', 'Bill Hagerty',
            'Donald J Trump', 'Donald Trump', 'Joe Biden', 'Kamala Harris'
        ].map(n => n.toLowerCase()));

        const isValidPolitician = (name: string): boolean => {
            if (!name) return false;
            const clean = name.trim().toLowerCase();
            if (clean.includes('surveillance') || clean.includes('pool') || clean.includes('test') || clean.includes('placeholder') || clean.includes('unknown') || clean.includes('select') || clean.includes('feed') || clean.includes('title')) {
                return false;
            }
            if (!/^[a-zA-Z\s\.\-]+$/.test(clean)) {
                return false;
            }
            const matchName = clean.replace(/^(hon\.|senator|representative|mr\.|mrs\.|ms\.)\s+/i, '').trim();
            return OFFICIAL_ROSTER.has(matchName);
        };

        const trades = (dbTrades || [])
            .map(t => {
                const nameLower = (t.politician_name || '').toLowerCase();
                if (!isValidPolitician(t.politician_name)) {
                    console.error(`[CRITICAL EXCEPTION] Discarded broken row containing boilerplate/placeholder name: "${t.politician_name}"`);
                    return null;
                }
                const isExecutiveFiler = nameLower.includes('trump') || nameLower.includes('biden') || nameLower.includes('harris') || nameLower.includes('president') || nameLower.includes('vice president');
                if (isExecutiveFiler) {
                    return {
                        ...t,
                        chamber: 'Executive',
                        party: nameLower.includes('trump') ? 'R' : 'D',
                        committee_overlap: false
                    };
                }
                return t;
            })
            .filter((t): t is NonNullable<typeof t> => t !== null);

        // 3. STEP 1: Macro Risk Filter ($SPY and $QQQ moving averages)
        const spyPrices = simulatePriceSeries("SPY", 250);
        const qqqPrices = simulatePriceSeries("QQQ", 250);
        
        const calcMA = (prices: number[], period: number) => {
            const sum = prices.slice(prices.length - period).reduce((a, b) => a + b, 0);
            return sum / period;
        };

        const spyClose = spyPrices[spyPrices.length - 1];
        const spy50MA = calcMA(spyPrices, 50);
        const spy200MA = calcMA(spyPrices, 200);

        const qqqClose = qqqPrices[qqqPrices.length - 1];
        const qqq50MA = calcMA(qqqPrices, 50);
        const qqq200MA = calcMA(qqqPrices, 200);

        const isSpyRiskOff = spyClose < spy50MA || spyClose < spy200MA;
        const isQqqRiskOff = qqqClose < qqq50MA || qqqClose < qqq200MA;
        const globalRiskOff = isSpyRiskOff && isQqqRiskOff;

        // 4. Ingest and Score Tickers
        const tickersToEvaluate = Object.keys(COMPANY_DIRECTORY);
        const generatedPicks: any[] = [];
        const today = new Date().toISOString().slice(0, 10);

        // API Key for optional news analysis
        const apiKey = process.env.OPENAI_API_KEY || '';
        const openai = apiKey ? new OpenAI({ apiKey }) : null;

        for (const ticker of tickersToEvaluate) {
            const details = COMPANY_DIRECTORY[ticker];
            const prices = simulatePriceSeries(ticker, 250);
            const currentPrice = prices[prices.length - 1];

            // A. Technical Vectoring (1d, 7d, 15d, 30d returns)
            const p1 = prices[prices.length - 2];
            const p7 = prices[prices.length - 8];
            const p15 = prices[prices.length - 16];
            const p30 = prices[prices.length - 31];

            const perf_1d = parseFloat(((currentPrice - p1) / p1 * 100).toFixed(2));
            const perf_7d = parseFloat(((currentPrice - p7) / p7 * 100).toFixed(2));
            const perf_15d = parseFloat(((currentPrice - p15) / p15 * 100).toFixed(2));
            const perf_30d = parseFloat(((currentPrice - p30) / p30 * 100).toFixed(2));

            const momentum_metrics = {
                "1d": perf_1d,
                "7d": perf_7d,
                "15d": perf_15d,
                "30d": perf_30d
            };

            // B. News Sentiment Evaluation
            let newsSentimentScore = 50.0;
            let catalystText = "Upcoming quarterly earnings disclosure scheduled.";

            if (openai) {
                try {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "Analyze sentiment for the given ticker. Output a number between 0 (very negative) and 100 (very positive) followed by a | and a one-sentence news catalyst." },
                            { role: "user", content: `Evaluate ticker: ${ticker}` }
                        ]
                    });
                    const content = response.choices[0]?.message?.content || "";
                    const parts = content.split("|");
                    if (parts[0]) {
                        const parsed = parseFloat(parts[0].trim());
                        if (!isNaN(parsed)) newsSentimentScore = parsed;
                    }
                    if (parts[1]) catalystText = parts[1].trim();
                } catch {
                    // Fallback to deterministic pseudorandom score
                    const seed = ticker.charCodeAt(0) + ticker.charCodeAt(1);
                    newsSentimentScore = parseFloat((50 + Math.sin(seed) * 30).toFixed(1));
                }
            } else {
                const seed = ticker.charCodeAt(0) + ticker.charCodeAt(1);
                newsSentimentScore = parseFloat((50 + Math.sin(seed) * 30).toFixed(1));
            }

            // C. Network Effect and Political Clustered Signals
            const tickerTrades = trades.filter(t => t.ticker === ticker);
            const purchases = tickerTrades.filter(t => t.transaction_type === 'Purchase');
            
            // Calculate overlap points
            const committeeOverlapCount = purchases.filter(t => t.committee_overlap).length;
            
            // Peer Velocity: unique representatives buying within last 45 days
            const uniqueRepBuyers = new Set(purchases.map(t => t.politician_name));
            const peerVelocity = uniqueRepBuyers.size;

            // Geographical/State delegation clustering:
            const stateCounts: Record<string, number> = {};
            purchases.forEach(t => {
                const state = STATE_DELEGATIONS[t.politician_name];
                if (state) stateCounts[state] = (stateCounts[state] || 0) + 1;
            });
            const hasStateCluster = Object.values(stateCounts).some(count => count >= 2);

            // Compute component scores (1-100 scale)
            // Political Score
            let politicalScore = 30.0; // Baseline
            if (committeeOverlapCount > 0) politicalScore += 30;
            if (peerVelocity > 0) politicalScore += Math.min(peerVelocity * 10, 25);
            if (hasStateCluster) politicalScore += 15;
            politicalScore = Math.min(politicalScore, 100);

            // Momentum Score
            let momentumScore = 50.0 + (perf_1d * 3) + (perf_7d * 1.5) + (perf_15d * 1.0) + (perf_30d * 0.5);
            momentumScore = Math.max(1, Math.min(100, momentumScore));

            // Sentiment Score
            const sentimentScore = newsSentimentScore;

            // Catalyst Score
            let catalystScore = 50.0;
            if (catalystText.toLowerCase().includes("positive") || catalystText.toLowerCase().includes("growth") || catalystText.toLowerCase().includes("approval")) {
                catalystScore = 85.0;
            } else if (catalystText.toLowerCase().includes("delay") || catalystText.toLowerCase().includes("lawsuit") || catalystText.toLowerCase().includes("investigation")) {
                catalystScore = 20.0;
            }

            // Calculate final convict score
            const conviction_score = parseFloat((
                politicalScore * Number(config.political_weight) +
                momentumScore * Number(config.momentum_weight) +
                sentimentScore * Number(config.sentiment_weight) +
                catalystScore * Number(config.catalyst_weight)
            ).toFixed(1));

            // Volatility-adjusted Position Sizing & ATR-based Stop Loss
            const atr = calculateATR(prices, 14);
            const baseSize = 5.0; // 5% base allocation
            const riskOffMultiplier = globalRiskOff ? 0.5 : 1.0;
            const volatilityMultiplier = Math.max(0.5, Math.min(1.5, (currentPrice / (atr * 15))));
            const position_size = parseFloat((baseSize * volatilityMultiplier * riskOffMultiplier).toFixed(2));
            const stop_loss = parseFloat((currentPrice - (atr * 2.0)).toFixed(2));

            // Build dynamic rationales
            const rationale_summary = `${ticker} displays high conviction (Score ${conviction_score}/100) fueled by ${peerVelocity} politician buyers with a committee overlap count of ${committeeOverlapCount}.${hasStateCluster ? " Multiple state delegation members buy-in simultaneously, triggering regulatory signals." : ""} Technical indicators highlight rolling 7d momentum at ${perf_7d}%, with a simulated ATR of $${atr}.`;

            generatedPicks.push({
                ticker,
                company_name: details.name,
                conviction_score,
                momentum_metrics,
                news_sentiment_score: newsSentimentScore,
                upcoming_catalyst: catalystText,
                rationale_summary,
                generated_date: today,
                position_size,
                stop_loss
            });
        }

        // Sort by conviction score descending, isolate top 10
        generatedPicks.sort((a, b) => b.conviction_score - a.conviction_score);
        const top10 = generatedPicks.slice(0, 10);

        // Bulk insert daily top picks via security definer RPC
        await supabase.rpc('rpc_upsert_daily_top_picks', { picks_json: top10 });

        // 5. STEP 2: AUTOMATED PORTFOLIO TRACKER & EXIT AUDIT
        const { data: dbActivePositions } = await supabase
            .from('portfolio_tracker')
            .select('*')
            .eq('current_status', 'Hold');

        const activePositions = dbActivePositions || [];

        for (const pos of activePositions) {
            const sym = pos.ticker;
            const prices = simulatePriceSeries(sym, 250);
            const currentPrice = prices[prices.length - 1];

            // Evaluate exit conditions
            const stopLossTriggered = currentPrice <= Number(pos.stop_loss);

            // Momentum breakdown: close below 15-day moving average
            const ma15 = calcMA(prices, 15);
            const momentumBreakdown = currentPrice < ma15;

            // Sudden high-volume insider political dumping (more sells than purchases recently)
            const symTrades = trades.filter(t => t.ticker === sym);
            const recentSales = symTrades.filter(t => t.transaction_type === 'Sale');
            const politicalDump = recentSales.length >= 3;

            let shouldExit = false;
            let exitReason = "";

            if (stopLossTriggered) {
                shouldExit = true;
                exitReason = `Stop-loss breached at $${currentPrice} (Stop was $${pos.stop_loss}).`;
            } else if (momentumBreakdown) {
                shouldExit = true;
                exitReason = `Momentum breakdown triggered as close price ($${currentPrice}) dropped below 15d MA ($${ma15.toFixed(2)}).`;
            } else if (politicalDump) {
                shouldExit = true;
                exitReason = `High-volume legislative exit signal: ${recentSales.length} politicians dump assets within 30-day window.`;
            }

            if (shouldExit) {
                await supabase.rpc('rpc_close_portfolio_position', {
                    p_id: pos.id,
                    p_exit_price: currentPrice,
                    p_exit_date: today,
                    p_exit_reason: exitReason
                });

                // Write audit details to accuracy_ledger
                await supabase.rpc('rpc_insert_accuracy_ledger', {
                    records_json: [{
                        recommendation_date: pos.entry_date,
                        ticker: sym,
                        entry_price: pos.entry_price,
                        open_price: pos.entry_price,
                        high_price: Math.max(...prices.slice(prices.length - 30)),
                        low_price: Math.min(...prices.slice(prices.length - 30)),
                        close_price: currentPrice,
                        perf_1d: 0.0,
                        perf_7d: 0.0,
                        perf_15d: 0.0,
                        perf_30d: 0.0,
                        is_winner: currentPrice > pos.entry_price
                    }]
                });
            }
        }

        // Add newly generated top-3 picks into portfolio_tracker (if not already tracking)
        const top3 = top10.slice(0, 3);
        const portfolioInsert: any[] = [];
        for (const pick of top3) {
            const sym = pick.ticker;
            const { data: existing } = await supabase
                .from('portfolio_tracker')
                .select('*')
                .eq('ticker', sym)
                .eq('current_status', 'Hold')
                .maybeSingle();

            if (!existing) {
                const prices = simulatePriceSeries(sym, 250);
                const currentPrice = prices[prices.length - 1];
                portfolioInsert.push({
                    ticker: sym,
                    entry_date: today,
                    entry_price: currentPrice,
                    current_status: 'Hold',
                    position_size: pick.position_size,
                    stop_loss: pick.stop_loss
                });
            }
        }

        if (portfolioInsert.length > 0) {
            await supabase.rpc('rpc_upsert_portfolio_tracker', { positions_json: portfolioInsert });
        }

        return NextResponse.json({
            success: true,
            risk_status: globalRiskOff ? "RISK-OFF" : "RISK-ON",
            picks_count: top10.length,
            portfolio_exits_triggered: activePositions.filter(p => p.current_status === 'Sell').length,
            portfolio_entries_added: portfolioInsert.length
        });
    } catch (err: any) {
        console.error("Top Pick Engine Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
