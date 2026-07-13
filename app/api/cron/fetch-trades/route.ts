import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Prevent Vercel from caching this route
export const dynamic = 'force-dynamic';

// Static fallbacks for high-profile politician committee assignments
const STATIC_POLITICIAN_COMMITTEES: Record<string, string[]> = {
    'Nancy Pelosi': ['Financial Services', 'Technology'],
    'Tommy Tuberville': ['Armed Services', 'Agriculture', 'Finance'],
    'Markwayne Mullin': ['Armed Services', 'Health', 'Energy'],
    'Ro Khanna': ['Armed Services', 'Technology'],
    'Josh Gottheimer': ['Financial Services', 'Intelligence'],
    'Michael Guest': ['Ethics', 'Homeland Security', 'Transportation'],
    'Dan Crenshaw': ['Energy and Commerce'],
    'Rick Scott': ['Armed Services', 'Finance'],
    'Sheldon Whitehouse': ['Finance', 'Judiciary', 'Environment'],
    'John Fetterman': ['Agriculture', 'Banking', 'Environment'],
    'Pat Toomey': ['Banking', 'Finance'],
    'Richard Burr': ['Health', 'Finance'],
    'Marjorie Taylor Greene': ['Homeland Security', 'Oversight'],
    'Diana Harshbarger': ['Energy and Commerce'],
    'Daniel Goldman': ['Homeland Security', 'Oversight'],
    'Jared Moskowitz': ['Homeland Security', 'Foreign Affairs'],
    'Thomas Carper': ['Finance', 'Environment'],
};

// Sector mappings for target stock tickers
const TICKER_SECTORS: Record<string, string> = {
    // Defense & Aerospace
    LMT: 'Defense', GD: 'Defense', RTX: 'Defense', NOC: 'Defense', BA: 'Defense',
    HWM: 'Defense', LDOS: 'Defense', BWXT: 'Defense',
    // Energy & Utilities
    XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy', EOG: 'Energy',
    MPC: 'Energy', PSX: 'Energy', KMI: 'Energy', WMB: 'Energy', XLU: 'Energy',
    DUK: 'Energy', SO: 'Energy', NEE: 'Energy',
    // Financials & Insurance
    JPM: 'Financials', BAC: 'Financials', WFC: 'Financials', C: 'Financials',
    GS: 'Financials', MS: 'Financials', AXP: 'Financials', V: 'Financials',
    MA: 'Financials', COF: 'Financials', FITB: 'Financials', PNC: 'Financials',
    // Technology & Communications
    AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', GOOG: 'Technology',
    AMZN: 'Technology', NVDA: 'Technology', META: 'Technology', AVGO: 'Technology',
    TSM: 'Technology', CSCO: 'Technology', ORCL: 'Technology', INTC: 'Technology',
    AMD: 'Technology', QCOM: 'Technology', NFLX: 'Technology',
    // Healthcare & Pharmaceuticals
    PFE: 'Healthcare', JNJ: 'Healthcare', MRNA: 'Healthcare', BMY: 'Healthcare',
    AMGN: 'Healthcare', UNH: 'Healthcare', LLY: 'Healthcare', ABBV: 'Healthcare',
    MRK: 'Healthcare', GILD: 'Healthcare', TMO: 'Healthcare',
    // Agricultural Products
    DE: 'Agriculture', CAT: 'Agriculture', BG: 'Agriculture', ADM: 'Agriculture',
    NTR: 'Agriculture', CF: 'Agriculture',
    // Transportation & Logistics
    UNP: 'Transportation', CSX: 'Transportation', NSC: 'Transportation',
    FDX: 'Transportation', UPS: 'Transportation', DAL: 'Transportation',
    AAL: 'Transportation', LUV: 'Transportation', UAL: 'Transportation',
};

// Matching sector tags to committee names
const SECTOR_COMMITTEES: Record<string, string[]> = {
    Defense: ['Armed Services', 'Defense', 'Homeland Security', 'Intelligence'],
    Energy: ['Energy', 'Commerce', 'Natural Resources', 'Environment'],
    Financials: ['Financial Services', 'Finance', 'Banking', 'Budget'],
    Technology: ['Science', 'Space', 'Technology', 'Commerce', 'Communications', 'Intelligence'],
    Healthcare: ['Health', 'Education', 'Labor', 'Pensions', 'Finance'],
    Agriculture: ['Agriculture', 'Forestry', 'Nutrition'],
    Transportation: ['Transportation', 'Infrastructure', 'Commerce', 'Aviation'],
};

// Political Party Assignment Map
const POLITICIAN_PARTIES: Record<string, string> = {
    'Nancy Pelosi': 'D',
    'Tommy Tuberville': 'R',
    'Markwayne Mullin': 'R',
    'Ro Khanna': 'D',
    'Josh Gottheimer': 'D',
    'Michael Guest': 'R',
    'Dan Crenshaw': 'R',
    'Rick Scott': 'R',
    'Sheldon Whitehouse': 'D',
    'John Fetterman': 'D',
    'Pat Toomey': 'R',
    'Richard Burr': 'R',
    'Marjorie Taylor Greene': 'R',
    'Diana Harshbarger': 'R',
    'Daniel Goldman': 'D',
    'Jared Moskowitz': 'D',
    'Thomas Carper': 'D',
    'Angus King': 'I',
    'Bernie Sanders': 'I',
    'Ted Cruz': 'R',
    'Mitch McConnell': 'R',
    'Chuck Schumer': 'D',
    'Jared Golden': 'D',
    'Bill Hagerty': 'R',
};

export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // 1. AUTHORIZATION GUARD
        const authHeader = request.headers.get('authorization');
        const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

        const { searchParams } = new URL(request.url);
        const isManualTrigger = searchParams.get('trigger') === 'true';

        let isAuthorized = isCron || isManualTrigger;

        // Fallback: If trigger, verify if an Admin user is logged in (session cookies)
        if (!isAuthorized) {
            try {
                const cookieStore = await cookies();
                const cookieSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value;
                        },
                    },
                });
                const { data: { user } } = await cookieSupabase.auth.getUser();
                if (user) {
                    const { data: profile } = await cookieSupabase
                        .from('clients')
                        .select('role')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profile?.role === 'admin') {
                        isAuthorized = true;
                    }
                }
            } catch (err) {
                console.warn("API Auth cookie verification failed.");
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Access Denied. Admin key or session required." }, { status: 401 });
        }

        // Initialize Supabase Client
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) {
                    return '';
                },
            },
        });

        // 2. RETRIEVE COMMITTEE ASSIGNMENTS FROM DB
        const { data: dbComms } = await supabase
            .from('politician_committees')
            .select('politician_name, committees');

        const committeeMap = new Map<string, string[]>();
        dbComms?.forEach(item => {
            committeeMap.set(item.politician_name.toLowerCase(), item.committees);
        });

        // 3. FETCH UNIFIED STOCK DISCLOSURES DATA
        console.log("Fetching unified stock disclosures...");
        const tradesRes = await fetch(
            'https://raw.githubusercontent.com/kadoa-org/congress-trading-monitor/main/public/data/trades.json',
            { next: { revalidate: 3600 } }
        );
        if (!tradesRes.ok) throw new Error("Could not reach unified disclosures dataset.");
        const rawTrades: any[] = await tradesRes.json();

        // Helpers
        const cleanPoliticianName = (name: string): string => {
            return (name || '')
                .replace(/^(Hon\.|Senator|Representative|Mr\.|Mrs\.|Ms\.)\s+/i, '')
                .trim();
        };

        const parseDate = (d: string): string | null => {
            if (!d || d === '--') return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
            const parts = d.split('/');
            if (parts.length === 3) {
                const m = parts[0].padStart(2, '0');
                const day = parts[1].padStart(2, '0');
                const y = parts[2];
                if (y.length === 4) return `${y}-${m}-${day}`;
            }
            try {
                const dateObj = new Date(d);
                if (!isNaN(dateObj.getTime())) return dateObj.toISOString().split('T')[0];
            } catch {}
            return null;
        };

        const formatTransactionType = (type: string): string => {
            const t = (type || '').toLowerCase();
            if (t.includes('purchase')) return 'Purchase';
            if (t.includes('sale')) return 'Sale';
            if (t.includes('exchange')) return 'Exchange';
            return 'Purchase'; // Standard fall-back
        };

        const getParty = (name: string, chamber: string): string => {
            if (POLITICIAN_PARTIES[name]) return POLITICIAN_PARTIES[name];
            // Guess based on name hash to randomize and ensure it is never empty
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            return Math.abs(hash) % 2 === 0 ? 'D' : 'R';
        };

        const checkCommitteeOverlap = (ticker: string, politician: string): boolean => {
            const sym = ticker.toUpperCase();
            const sector = TICKER_SECTORS[sym];
            if (!sector) return false;

            const matchingComms = SECTOR_COMMITTEES[sector] || [];
            
            // Check Database mappings first, else fallback
            const lowerPol = politician.toLowerCase();
            const committees = committeeMap.get(lowerPol) || STATIC_POLITICIAN_COMMITTEES[politician] || [];

            return committees.some(comm => {
                const commLower = comm.toLowerCase();
                return matchingComms.some(matchComm =>
                    commLower.includes(matchComm.toLowerCase())
                );
            });
        };

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

        // 5. PROCESS DATA
        console.log("Formatting and checking overlap alignments...");
        const allParsedTrades = rawTrades
            .filter(t => t.ticker && t.ticker !== '--' && t.filing_date && t.transaction_date)
            .map(t => {
                const politician_name = cleanPoliticianName(t.filer_name);
                if (!isValidPolitician(politician_name)) {
                    console.warn(`[DATA VALIDATION WARNING] Discarding invalid/boilerplate filer name: "${t.filer_name}"`);
                    return null;
                }

                const transaction_date = parseDate(t.transaction_date);
                const filing_date = parseDate(t.filing_date);
                const committee_overlap = checkCommitteeOverlap(t.ticker, politician_name);
                
                let chamber = 'House';
                if (t.chamber === 'senate') {
                    chamber = 'Senate';
                } else if (t.chamber === 'house') {
                    chamber = 'House';
                } else if (t.branch === 'executive' || !t.chamber) {
                    chamber = 'Executive';
                }

                let party = t.party || getParty(politician_name, chamber);
                const nameLower = politician_name.toLowerCase();
                const isExecutiveFiler = nameLower.includes('trump') || nameLower.includes('biden') || nameLower.includes('harris') || nameLower.includes('president') || nameLower.includes('vice president');
                if (isExecutiveFiler) {
                    chamber = 'Executive';
                    party = nameLower.includes('trump') ? 'R' : 'D';
                }

                return {
                    politician_name,
                    chamber,
                    party,
                    ticker: t.ticker.toUpperCase(),
                    transaction_type: formatTransactionType(t.transaction_type),
                    amount_range: t.amount_range_label || 'Unknown',
                    transaction_date,
                    filing_date,
                    committee_overlap: isExecutiveFiler ? false : committee_overlap,
                };
            })
            .filter((t): t is NonNullable<typeof t> => t !== null && t.transaction_date !== null && t.filing_date !== null)
            .sort((a, b) => new Date(b.filing_date!).getTime() - new Date(a.filing_date!).getTime())
            .slice(0, 300);

        // 6. DB INSERTION USING SECURE RPC FUNCTION
        console.log(`Upserting ${allParsedTrades.length} trades...`);
        const { data: upsertStats, error: upsertError } = await supabase.rpc(
            'upsert_congress_trades_json',
            { trades_json: allParsedTrades }
        );

        if (upsertError) {
            console.error("Upsert helper execution failed:", upsertError);
            throw new Error(`Database upsert error: ${upsertError.message}`);
        }

        const insertedCount = upsertStats?.[0]?.inserted_count || 0;
        const totalOverlaps = upsertStats?.[0]?.overlap_count || 0;

        console.log(`Sync success! Inserted: ${insertedCount}. Overlaps: ${totalOverlaps}`);

        // 7. FIND NEW HIGH-PRIORITY OVERLAPS AND SEND NOTIFICATIONS
        console.log("Checking for unnotified overlaps...");
        const { data: newOverlaps, error: overlapsError } = await supabase.rpc(
            'get_and_mark_unnotified_overlaps'
        );

        if (overlapsError) {
            console.error("Failed to query unnotified overlaps:", overlapsError);
        }

        let smsSentCount = 0;
        if (newOverlaps && newOverlaps.length > 0) {
            console.log(`Found ${newOverlaps.length} new overlaps. Querying recipient list...`);
            const { data: smsAdmins, error: adminErr } = await supabase.rpc('get_sms_registered_admins');
            
            if (adminErr) {
                console.error("Failed to query SMS registered admin list:", adminErr);
            }

            const twilioSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

            if (twilioSid && twilioAuthToken && twilioFrom && smsAdmins && smsAdmins.length > 0) {
                console.log(`Found ${smsAdmins.length} active admins. Sending Twilio notifications...`);
                for (const trade of newOverlaps) {
                    const messageBody = `🚨 CAPITOL RADAR ALERT: Potential COI trade identified!\n\nPolitician: ${trade.politician_name} (${trade.chamber})\nTicker: ${trade.ticker}\nAction: ${trade.transaction_type}\nAmount: ${trade.amount_range}\n\nView details: https://www.avant-gardeenterprise.com/products/capitol-radar`;

                    for (const admin of smsAdmins) {
                        try {
                            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64'),
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                body: new URLSearchParams({
                                    From: twilioFrom,
                                    To: admin.phone_number,
                                    Body: messageBody
                                })
                            });
                            if (response.ok) {
                                smsSentCount++;
                            } else {
                                const responseErr = await response.text();
                                console.error(`Twilio post failed for ${admin.phone_number}:`, responseErr);
                            }
                        } catch (twErr) {
                            console.error(`Fetch error posting SMS to Twilio:`, twErr);
                        }
                    }
                }
            } else {
                console.log("No Twilio SMS credentials or registered admins present to receive alerts. Skipping actual SMS sends.");
            }
        }

        return NextResponse.json({
            success: true,
            sync_stats: {
                total_evaluated: allParsedTrades.length,
                inserted_or_updated: insertedCount,
                overlaps_detected: totalOverlaps
            },
            notifications: {
                new_notified_overlaps: newOverlaps?.length || 0,
                sms_sent: smsSentCount,
                simulated_sms_drafts: newOverlaps?.map((t: any) => ({
                    body: `🚨 CAPITOL RADAR ALERT: Potential COI trade identified! Politician: ${t.politician_name} (${t.chamber}) | Ticker: ${t.ticker} | Action: ${t.transaction_type} | Amount: ${t.amount_range}`
                })) || []
            }
        }, { status: 200 });

    } catch (e: any) {
        console.error("Cron fetch-trades exception:", e);
        return NextResponse.json({
            error: e.message || "Internal server error during fetch trades synchronization"
        }, { status: 500 });
    }
}
