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

    // ---- define required columns and read existing header ----
    const requiredCols = ['Symbol', 'Series', 'date', 'New52WHprice'];
    let allColumns: string[] = requiredCols.slice();
    let existingData = new Map<string, string[]>();

    if (fs.existsSync(DEST_FILE)) {
        const lines = fs.readFileSync(DEST_FILE, 'utf8')
            .split(/\r?\n/)
            .filter(Boolean);

        if (lines.length > 0) {
            // Read existing header to preserve all columns
            allColumns = parse(lines[0]!);

            // Parse existing data rows
            for (let i = 1; i < lines.length; i++) {
                const cols = parse(lines[i]!);
                const symbol = cols[0]; // Symbol is always first
                if (symbol) {
                    existingData.set(symbol, cols);
                }
            }
        }
    }

    // Ensure all required columns are present in header
    for (const reqCol of requiredCols) {
        if (!allColumns.includes(reqCol)) {
            allColumns.push(reqCol);
        }
    }

    // Get column indices
    const symIdx = allColumns.indexOf('Symbol');
    const seriesIdx = allColumns.indexOf('Series');
    const dateIdx = allColumns.indexOf('date');
    const priceIdx = allColumns.indexOf('New52WHprice');

    // ---- read today's source file ----
    expect(fs.existsSync(SRC_FILE)).toBeTruthy();
    const raw = fs.readFileSync(SRC_FILE, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean);

    const headers = parse(raw[0]!);
    const srcSymIdx = headers.indexOf('Symbol');
    const srcSerIdx = headers.indexOf('Series');
    const highIdx = headers.indexOf('New 52W/H price');

    expect([srcSymIdx, srcSerIdx, highIdx]).not.toContain(-1);

    // ---- process source rows ----
    let addedCount = 0;
    let updatedCount = 0;
    const finalData = new Map<string, string[]>();

    // First, copy all existing data to finalData
    for (const [sym, cols] of existingData) {
        // Ensure the row has enough columns
        while (cols.length < allColumns.length) {
            cols.push('');
        }
        finalData.set(sym, cols);
    }

    for (let i = 1; i < raw.length; i++) {
        const cols = parse(raw[i]!);
        const sym = cols[srcSymIdx];
        const series = cols[srcSerIdx];
        const newPriceStr = cols[highIdx];

        if (!sym || !newPriceStr) continue;

        const newPrice = parseFloat(newPriceStr);

        if (!finalData.has(sym)) {
            // New symbol - create a new row with all columns
            const newRow = new Array(allColumns.length).fill('');
            newRow[symIdx] = sym;
            newRow[seriesIdx] = series;
            newRow[dateIdx] = TODAY;
            newRow[priceIdx] = newPriceStr;
            finalData.set(sym, newRow);
            addedCount++;
        } else {
            // Existing symbol - check if we need to update
            const existing = finalData.get(sym)!;
            const existingPrice = parseFloat(existing[priceIdx]!);

            if (newPrice > existingPrice) {
                // Update with higher price and new date, preserve other columns
                existing[seriesIdx] = series!
                existing[dateIdx] = TODAY;
                existing[priceIdx] = newPriceStr;
                updatedCount++;
            }
        }
    }

    // ---- write back to file (overwrite) ----
    const header = allColumns.join(',') + '\n';
    const rows: string[] = [];

    for (const [sym, data] of finalData) {
        rows.push(data.join(','));
    }

    const fileContent = header + rows.join('\n') + (rows.length ? '\n' : '');
    fs.writeFileSync(DEST_FILE, fileContent);

    // ---- log results ----
    console.log(`✅ Processed ${raw.length - 1} source rows.`);
    console.log(`   Added: ${addedCount} new stocks.`);
    console.log(`   Updated: ${updatedCount} existing stocks with higher prices.`);
    console.log(`   Total in stocks.csv: ${finalData.size}`);
    console.log(`📋 Preserved ${allColumns.length} columns including any manually added ones.`);
});