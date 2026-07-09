const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    console.log("Downloading trades dataset...");
    const res = await fetch('https://raw.githubusercontent.com/kadoa-org/congress-trading-monitor/main/public/data/trades.json');
    if (!res.ok) throw new Error("Failed to fetch trades");
    const trades = await res.json();

    const tickers = new Set();
    trades.forEach(t => {
        if (t.ticker && t.ticker !== '--') {
            const sym = t.ticker.toUpperCase().replace(/[^A-Z0-9\.\-]/g, '');
            if (sym) tickers.add(sym);
        }
    });

    // Also force-add common assets
    tickers.add('US-TBILL');
    tickers.add('QQQ');
    tickers.add('VTI');
    tickers.add('VOO');

    const tickerList = Array.from(tickers);
    console.log(`Extracted ${tickerList.length} unique tickers. Generating profiles...`);

    const directory = {};
    const batchSize = 40;

    for (let i = 0; i < tickerList.length; i += batchSize) {
        const batch = tickerList.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tickerList.length / batchSize)}: ${batch.join(', ')}`);

        const prompt = `You are a financial database generator. For the following stock ticker symbols, generate a JSON object where each key is the ticker symbol in uppercase, and the value is an object with "name" (official company name), "industry" (brief industry category), and "description" (a concise 1-sentence product/service summary).

Tickers: ${batch.join(', ')}

Ensure the JSON output is valid, structured, and has exactly these keys. Return ONLY the raw JSON string starting with { and ending with }. No markdown boxes.`;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You output only raw JSON without formatting marks." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
            });

            const content = completion.choices[0].message.content.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            const parsed = JSON.parse(content);
            Object.assign(directory, parsed);
        } catch (err) {
            console.error(`Failed batch starting with ${batch[0]}:`, err.message);
            // Wait and retry once
            await new Promise(r => setTimeout(r, 2000));
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You output only raw JSON without formatting marks." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.1,
                });
                const content = completion.choices[0].message.content.trim().replace(/^```json/, '').replace(/```$/, '').trim();
                const parsed = JSON.parse(content);
                Object.assign(directory, parsed);
            } catch (retryErr) {
                console.error(`Retry failed for batch. Generating mock entries...`);
                batch.forEach(sym => {
                    directory[sym] = {
                        name: `${sym} Corp.`,
                        industry: 'General Assets',
                        description: 'Publicly listed asset on standard US or global exchange markets.'
                    };
                });
            }
        }
    }

    console.log(`Successfully generated ${Object.keys(directory).length} profiles.`);

    // Read the page.tsx file
    const pagePath = path.join(__dirname, '../app/products/capitol-radar/page.tsx');
    let pageContent = fs.readFileSync(pagePath, 'utf8');

    // Find the const COMPANY_DIRECTORY declaration and replace it
    const startStr = 'const COMPANY_DIRECTORY: Record<string, CompanyDetails> = {';
    const endStr = '\n}';
    const startIndex = pageContent.indexOf(startStr);
    
    if (startIndex === -1) {
        console.error("Could not find const COMPANY_DIRECTORY in page.tsx. Splicing failed.");
        return;
    }

    // Find the matching end brace
    const searchAfterStart = pageContent.substring(startIndex + startStr.length);
    const endIndexInSub = searchAfterStart.indexOf('// Initial Simulated Quotes');
    if (endIndexInSub === -1) {
        console.error("Could not find '// Initial Simulated Quotes' anchor in page.tsx. Splicing failed.");
        return;
    }

    const endIndex = startIndex + startStr.length + endIndexInSub;

    // Build the new code block
    const formattedJson = JSON.stringify(directory, null, 4);
    const replacementStr = `const COMPANY_DIRECTORY: Record<string, CompanyDetails> = ${formattedJson};\n\n`;

    const newPageContent = pageContent.substring(0, startIndex) + replacementStr + pageContent.substring(endIndex);
    fs.writeFileSync(pagePath, newPageContent, 'utf8');
    
    console.log("Successfully wrote updated page.tsx with complete company directory!");
}

main().catch(err => {
    console.error("Scrape script failed:", err);
});
