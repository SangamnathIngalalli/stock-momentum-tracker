import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SRC_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\52WeekHigh.csv`;
const DEST_DIR = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\52-week-high`;
const DEST_FILE = path.join(DEST_DIR, 'stocks.csv');

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

test('update 52-week-high stocks.csv with fresh symbols and update prices', async () => {
    // ---- helpers ----
    const parse = (line: string) => line.split(',').map(c => c.trim());

    // ---- ensure destination folder ----
    if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR);

    // ---- load already-known symbols into a Map ----
    // Map<Symbol, { Series, Date, Price }>
    const stocksMap = new Map<string, { series: string, date: string, price: string }>();

    if (fs.existsSync(DEST_FILE)) {
        const lines = fs.readFileSync(DEST_FILE, 'utf8')
            .split(/\r?\n/)
            .filter(Boolean);

        // Skip header and parse existing data
        // Expected header: Symbol,Series,date,New52WHprice
        // If the file is old (EntryDate), we still just read the 3rd column as date
        for (let i = 1; i < lines.length; i++) {
            const [sym, ser, dt, pr] = parse(lines[i]);
            if (sym && pr) {
                stocksMap.set(sym, { series: ser, date: dt, price: pr });
            }
        }
    }

    // ---- read today’s source file ----
    expect(fs.existsSync(SRC_FILE)).toBeTruthy();
    const raw = fs.readFileSync(SRC_FILE, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean);

    const headers = parse(raw[0]);
    const symIdx = headers.indexOf('Symbol');
    const serIdx = headers.indexOf('Series');
    const highIdx = headers.indexOf('New 52W/H price');

    expect([symIdx, serIdx, highIdx]).not.toContain(-1);

    // ---- process source rows ----
    let addedCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < raw.length; i++) {
        const cols = parse(raw[i]);
        const sym = cols[symIdx];
        const series = cols[serIdx];
        const newPriceStr = cols[highIdx];

        if (!sym || !newPriceStr) continue;

        const newPrice = parseFloat(newPriceStr);

        if (!stocksMap.has(sym)) {
            // New symbol
            stocksMap.set(sym, { series, date: TODAY, price: newPriceStr });
            addedCount++;
        } else {
            // Existing symbol - check if we need to update
            const existing = stocksMap.get(sym)!;
            const existingPrice = parseFloat(existing.price);

            if (newPrice > existingPrice) {
                // Update with higher price and new date
                stocksMap.set(sym, { series, date: TODAY, price: newPriceStr });
                updatedCount++;
            }
        }
    }

    // ---- write back to file (overwrite) ----
    // New Header: Symbol,Series,date,New52WHprice
    const header = 'Symbol,Series,date,New52WHprice\n';
    const rows: string[] = [];

    for (const [sym, data] of stocksMap) {
        rows.push(`${sym},${data.series},${data.date},${data.price}`);
    }

    const fileContent = header + rows.join('\n') + (rows.length ? '\n' : '');
    fs.writeFileSync(DEST_FILE, fileContent);

    // ---- log results ----
    console.log(`✅ Processed ${raw.length - 1} source rows.`);
    console.log(`   Added: ${addedCount} new stocks.`);
    console.log(`   Updated: ${updatedCount} existing stocks with higher prices.`);
    console.log(`   Total in stocks.csv: ${stocksMap.size}`);
});