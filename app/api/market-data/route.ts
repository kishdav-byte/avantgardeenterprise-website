import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tickersParam = searchParams.get('tickers');
        
        if (!tickersParam) {
            return NextResponse.json({ error: 'Tickers parameter is required' }, { status: 400 });
        }
        
        const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
        const results: Record<string, { price: number; change: number; changePercent: number; prevPrice: number }> = {};
        
        // Fetch each ticker's current price and yesterday's close from Yahoo Finance
        await Promise.all(tickers.map(async (ticker) => {
            try {
                // query2 is generally less rate-limited and very reliable in Vercel environments
                const response = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Referer': 'https://finance.yahoo.com/'
                    },
                    next: { revalidate: 60 } // Cache for 60 seconds
                });
                
                if (!response.ok) {
                    throw new Error(`Yahoo returned status ${response.status}`);
                }
                
                const data = await response.json();
                const result = data.chart?.result?.[0];
                
                if (result) {
                    const meta = result.meta;
                    const price = meta.regularMarketPrice;
                    const prevPrice = meta.chartPreviousClose || price;
                    const change = price - prevPrice;
                    const changePercent = (change / prevPrice) * 100;
                    
                    results[ticker] = {
                        price: parseFloat(price.toFixed(2)),
                        change: parseFloat(change.toFixed(2)),
                        changePercent: parseFloat(changePercent.toFixed(2)),
                        prevPrice: parseFloat(prevPrice.toFixed(2))
                    };
                }
            } catch (err) {
                console.warn(`Failed to fetch live price for ${ticker}:`, err);
            }
        }));
        
        return NextResponse.json({ success: true, data: results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
