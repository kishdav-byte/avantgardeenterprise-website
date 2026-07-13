import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ticker = searchParams.get('ticker')?.trim().toUpperCase();
        
        if (!ticker) {
            return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 });
        }
        
        const response = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://finance.yahoo.com/'
            },
            next: { revalidate: 3600 } // Cache historical data for 1 hour
        });
        
        if (!response.ok) {
            throw new Error(`Yahoo Finance returned status ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
            throw new Error('Malformed data from Yahoo Finance');
        }
        
        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close || [];
        
        const history = timestamps.map((ts: number, i: number) => {
            const date = new Date(ts * 1000).toISOString().slice(0, 10);
            const rawPrice = closes[i];
            
            // Handle null/missing prices gracefully by carrying forward previous price or using fallback
            let price = rawPrice;
            if (price === null || price === undefined) {
                // Find nearest non-null price
                for (let j = i - 1; j >= 0; j--) {
                    if (closes[j] !== null && closes[j] !== undefined) {
                        price = closes[j];
                        break;
                    }
                }
                if (price === null || price === undefined) {
                    price = 100.0; // ultimate fallback
                }
            }
            
            return {
                date,
                price: parseFloat(price.toFixed(2))
            };
        }).filter((item: any) => item.price > 0);
        
        return NextResponse.json({ success: true, data: history });
    } catch (error: any) {
        console.error(`Failed to fetch history for ticker:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
