const fs = require('fs');
const path = require('path');

// 1. Read environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim();
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseAnonKey = line.split('=')[1].trim();
        }
    }
} catch (err) {
    console.error("Could not read .env.local file:", err);
    process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration in .env.local");
    process.exit(1);
}

// 2. Fetch and seed transactions from the past 6 months
const cutoffDate = new Date();
cutoffDate.setMonth(cutoffDate.getMonth() - 6);

console.log(`Ingesting transactions filed or traded on/after: ${cutoffDate.toISOString().split('T')[0]}`);

const STATIC_POLITICIAN_COMMITTEES = {
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

const TICKER_SECTORS = {
    LMT: 'Defense', GD: 'Defense', RTX: 'Defense', NOC: 'Defense', BA: 'Defense',
    HWM: 'Defense', LDOS: 'Defense', BWXT: 'Defense',
    XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy', EOG: 'Energy',
    MPC: 'Energy', PSX: 'Energy', KMI: 'Energy', WMB: 'Energy', XLU: 'Energy',
    DUK: 'Energy', SO: 'Energy', NEE: 'Energy',
    JPM: 'Financials', BAC: 'Financials', WFC: 'Financials', C: 'Financials',
    GS: 'Financials', MS: 'Financials', AXP: 'Financials', V: 'Financials',
    MA: 'Financials', COF: 'Financials', FITB: 'Financials', PNC: 'Financials',
    AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', GOOG: 'Technology',
    AMZN: 'Technology', NVDA: 'Technology', META: 'Technology', AVGO: 'Technology',
    TSM: 'Technology', CSCO: 'Technology', ORCL: 'Technology', INTC: 'Technology',
    AMD: 'Technology', QCOM: 'Technology', NFLX: 'Technology',
    PFE: 'Healthcare', JNJ: 'Healthcare', MRNA: 'Healthcare', BMY: 'Healthcare',
    AMGN: 'Healthcare', UNH: 'Healthcare', LLY: 'Healthcare', ABBV: 'Healthcare',
    MRK: 'Healthcare', GILD: 'Healthcare', TMO: 'Healthcare',
    DE: 'Agriculture', CAT: 'Agriculture', BG: 'Agriculture', ADM: 'Agriculture',
    NTR: 'Agriculture', CF: 'Agriculture',
    UNP: 'Transportation', CSX: 'Transportation', NSC: 'Transportation',
    FDX: 'Transportation', UPS: 'Transportation', DAL: 'Transportation',
    AAL: 'Transportation', LUV: 'Transportation', UAL: 'Transportation',
};

const SECTOR_COMMITTEES = {
    Defense: ['Armed Services', 'Defense', 'Homeland Security', 'Intelligence'],
    Energy: ['Energy', 'Commerce', 'Natural Resources', 'Environment'],
    Financials: ['Financial Services', 'Finance', 'Banking', 'Budget'],
    Technology: ['Science', 'Space', 'Technology', 'Commerce', 'Communications', 'Intelligence'],
    Healthcare: ['Health', 'Education', 'Labor', 'Pensions', 'Finance'],
    Agriculture: ['Agriculture', 'Forestry', 'Nutrition'],
    Transportation: ['Transportation', 'Infrastructure', 'Commerce', 'Aviation'],
};

const POLITICIAN_PARTIES = {
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

function getParty(name) {
    if (POLITICIAN_PARTIES[name]) return POLITICIAN_PARTIES[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 2 === 0 ? 'D' : 'R';
}

function formatTransactionType(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('purchase')) return 'Purchase';
    if (t.includes('sale')) return 'Sale';
    if (t.includes('exchange')) return 'Exchange';
    return 'Purchase'; // Standard fall-back
}

async function run() {
    // 1. Fetch DB committees mapping first to build overlap check
    const commsUrl = `${supabaseUrl}/rest/v1/politician_committees?select=politician_name,committees`;
    const commsHeaders = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
    };
    
    let committeeMap = new Map();
    try {
        const cRes = await fetch(commsUrl, { headers: commsHeaders });
        if (cRes.ok) {
            const dbComms = await cRes.json();
            dbComms.forEach(item => {
                committeeMap.set(item.politician_name.toLowerCase(), item.committees);
            });
        }
    } catch (err) {
        console.warn("Could not query DB committee mapping table, falling back to static lists.", err.message);
    }

    function checkCommitteeOverlap(ticker, politician) {
        if (!ticker) return false;
        const sym = ticker.toUpperCase();
        const sector = TICKER_SECTORS[sym];
        if (!sector) return false;
        const matchingComms = SECTOR_COMMITTEES[sector] || [];
        const lowerPol = politician.toLowerCase();
        const committees = committeeMap.get(lowerPol) || STATIC_POLITICIAN_COMMITTEES[politician] || [];
        return committees.some(comm => {
            const commLower = comm.toLowerCase();
            return matchingComms.some(matchComm =>
                commLower.includes(matchComm.toLowerCase())
            );
        });
    }

    // 2. Fetch Kadoa Trades raw data (unified dataset containing House, Senate, and Executive)
    console.log("Downloading unified Congress/Senate/Executive trades data from Kadoa...");
    const tradesRes = await fetch('https://raw.githubusercontent.com/kadoa-org/congress-trading-monitor/main/public/data/trades.json');
    if (!tradesRes.ok) throw new Error("Could not reach unified trades data feed.");
    const rawTrades = await tradesRes.json();

    const allParsedTrades = [];

    rawTrades.forEach(t => {
        if (!t.ticker || t.ticker === '--' || !t.filing_date || !t.transaction_date) return;
        
        // We filter by filing date or transaction date being in the last 6 months
        const filingDate = new Date(t.filing_date);
        const transDate = new Date(t.transaction_date);
        
        if (filingDate >= cutoffDate || transDate >= cutoffDate) {
            const politician_name = t.filer_name.replace(/^(Hon\.|Senator|Representative|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
            const committee_overlap = checkCommitteeOverlap(t.ticker, politician_name);
            
            // Map chamber to House, Senate, or Executive
            let chamber = 'House';
            if (t.chamber === 'senate') {
                chamber = 'Senate';
            } else if (t.chamber === 'house') {
                chamber = 'House';
            } else if (t.branch === 'executive' || !t.chamber) {
                chamber = 'Executive';
            }

            allParsedTrades.push({
                politician_name,
                chamber,
                party: t.party || getParty(politician_name),
                ticker: t.ticker.toUpperCase(),
                transaction_type: formatTransactionType(t.transaction_type),
                amount_range: t.amount_range_label || 'Unknown',
                transaction_date: t.transaction_date,
                filing_date: t.filing_date,
                committee_overlap,
            });
        }
    });

    console.log(`Parsed ${allParsedTrades.length} trades within the past 6 months.`);

    // 4. Batch upsert trades to Supabase using RPC function (batch size 150)
    const batchSize = 150;
    let successCount = 0;
    
    for (let i = 0; i < allParsedTrades.length; i += batchSize) {
        const batch = allParsedTrades.slice(i, i + batchSize);
        console.log(`Uploading batch ${Math.floor(i / batchSize) + 1} (${batch.length} trades)...`);
        
        const rpcUrl = `${supabaseUrl}/rest/v1/rpc/upsert_congress_trades_json`;
        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ trades_json: batch })
        });
        
        if (res.ok) {
            const stats = await res.json();
            const inserted = stats?.[0]?.inserted_count || 0;
            successCount += inserted;
        } else {
            const errMsg = await res.text();
            console.error(`Batch upload failed:`, errMsg);
        }
    }
    
    console.log(`SUCCESS: Ingested ${successCount} new transactions from the past 6 months into the database.`);
}

run().catch(console.error);
