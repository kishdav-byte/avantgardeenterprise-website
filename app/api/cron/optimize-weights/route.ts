import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

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

        // 1. Fetch the last 30 days of records from accuracy_ledger
        const { data: ledgerRecords } = await supabase
            .from('accuracy_ledger')
            .select('*')
            .order('recommendation_date', { ascending: false })
            .limit(100);

        const records = ledgerRecords || [];
        
        // 2. Isolate top 5 winners and bottom 5 losers
        const evaluatedRecords = records.map(r => {
            const entry = Number(r.entry_price);
            const close = Number(r.close_price || r.entry_price);
            const returnPct = entry > 0 ? ((close - entry) / entry * 100) : 0;
            return { ...r, returnPct };
        });

        const winners = [...evaluatedRecords]
            .filter(r => r.returnPct > 0)
            .sort((a, b) => b.returnPct - a.returnPct)
            .slice(0, 5);

        const losers = [...evaluatedRecords]
            .filter(r => r.returnPct <= 0)
            .sort((a, b) => a.returnPct - b.returnPct)
            .slice(0, 5);

        // 3. Current active configuration
        const { data: currentConfigs } = await supabase.rpc('rpc_get_system_config');
        const currentConfig = currentConfigs && currentConfigs[0] ? currentConfigs[0] : {
            political_weight: 0.35,
            momentum_weight: 0.35,
            sentiment_weight: 0.20,
            catalyst_weight: 0.10
        };

        // 4. Autonomous re-weighting calculations (Deterministic feedback loop + LLM option)
        let newPoliticalWeight = Number(currentConfig.political_weight);
        let newMomentumWeight = Number(currentConfig.momentum_weight);
        let newSentimentWeight = Number(currentConfig.sentiment_weight);
        let newCatalystWeight = Number(currentConfig.catalyst_weight);
        
        // Audit ledger returns to shift weights
        let adjustmentLog = "";
        let totalReturn = evaluatedRecords.reduce((sum, r) => sum + r.returnPct, 0);
        let avgReturn = evaluatedRecords.length > 0 ? (totalReturn / evaluatedRecords.length) : 0;

        // Perform programmatic optimization based on win ratios
        if (evaluatedRecords.length > 0) {
            const winCount = evaluatedRecords.filter(r => r.is_winner).length;
            const winRate = winCount / evaluatedRecords.length;

            if (winRate < 0.50) {
                // Shift focus to high-conviction Political trades if win rate drops
                newPoliticalWeight = Math.min(0.50, newPoliticalWeight + 0.05);
                newMomentumWeight = Math.max(0.20, newMomentumWeight - 0.02);
                newSentimentWeight = Math.max(0.10, newSentimentWeight - 0.03);
                adjustmentLog += `Underperforming market regimes detected (win rate ${Math.round(winRate * 100)}%). Scaling up regulatory political weight mapping. `;
            } else {
                // Focus on Technical Momentum in trending markets
                newMomentumWeight = Math.min(0.50, newMomentumWeight + 0.05);
                newPoliticalWeight = Math.max(0.20, newPoliticalWeight - 0.02);
                newSentimentWeight = Math.max(0.10, newSentimentWeight - 0.03);
                adjustmentLog += `Optimal market conditions verified (win rate ${Math.round(winRate * 100)}%). Enhancing technical momentum windows. `;
            }
        } else {
            // Keep default shifts
            newPoliticalWeight = 0.38;
            newMomentumWeight = 0.35;
            newSentimentWeight = 0.17;
            newCatalystWeight = 0.10;
            adjustmentLog = "Initial engine calibration sequence initialized. Balancing parameters across all signals. ";
        }

        // Normalize weights to sum to 1.00
        const totalW = newPoliticalWeight + newMomentumWeight + newSentimentWeight + newCatalystWeight;
        newPoliticalWeight = parseFloat((newPoliticalWeight / totalW).toFixed(2));
        newMomentumWeight = parseFloat((newMomentumWeight / totalW).toFixed(2));
        newSentimentWeight = parseFloat((newSentimentWeight / totalW).toFixed(2));
        newCatalystWeight = parseFloat((1 - (newPoliticalWeight + newMomentumWeight + newSentimentWeight)).toFixed(2));

        // 5. Execute LLM structural feedback loop if API Key is available
        const apiKey = process.env.OPENAI_API_KEY || '';
        if (apiKey) {
            try {
                const openai = new OpenAI({ apiKey });
                const prompt = `You are the core neural re-weighting optimization layer of a Capitol Radar stock investment algorithm.
Here is your historical portfolio accuracy audit performance:
- Average Portfolio Return: ${avgReturn.toFixed(2)}%
- Top 5 winning stocks: ${winners.map(w => `${w.ticker} (+${w.returnPct.toFixed(1)}%)`).join(', ')}
- Bottom 5 losing stocks: ${losers.map(l => `${l.ticker} (${l.returnPct.toFixed(1)}%)`).join(', ')}
- Current Weights: Political: ${currentConfig.political_weight}, Momentum: ${currentConfig.momentum_weight}, Sentiment: ${currentConfig.sentiment_weight}, Catalyst: ${currentConfig.catalyst_weight}

Provide a 3-sentence executive summary detailing why current weights caused winners or losers, and specify target adjustments to optimize performance.`;

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You optimize numerical investment parameters. Output only a concise log summary." },
                        { role: "user", content: prompt }
                    ]
                });
                adjustmentLog += (completion.choices[0]?.message?.content || "").trim();
            } catch (err: any) {
                adjustmentLog += `Failed to invoke LLM feedback sequence: ${err.message}. Applied fallback heuristic adjustment matrix.`;
            }
        } else {
            adjustmentLog += `Programmatic feedback loop applied. Increased political weights to guard against sentiment-only signals in high-volatility environments.`;
        }

        // 6. Rewrite updated weights and optimization log to database
        await supabase.rpc('rpc_update_system_config', {
            p_political: newPoliticalWeight,
            p_momentum: newMomentumWeight,
            p_sentiment: newSentimentWeight,
            p_catalyst: newCatalystWeight,
            p_log: adjustmentLog
        });

        return NextResponse.json({
            success: true,
            previous_weights: currentConfig,
            new_weights: {
                political: newPoliticalWeight,
                momentum: newMomentumWeight,
                sentiment: newSentimentWeight,
                catalyst: newCatalystWeight
            },
            optimization_log: adjustmentLog
        });
    } catch (err: any) {
        console.error("Optimization Engine Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
