import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SRC_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\52WeekHigh.csv`;
const DEST_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.csv`;

const TODAY = new Date().toLocaleDateString('en-US'); // M/D/YYYY format

test('update My_Track with new 52-week high stocks', async () => {
    // ---- Helper function to parse CSV line ----
    const parse = (line: string) => line.split(',').map(c => c.trim());

    // ---- Verify source file exists ----
    expect(fs.existsSync(SRC_FILE), `Source file not found: ${SRC_FILE}`).toBeTruthy();

    // ---- Read existing My_Track data ----
    let allColumns: string[] = [];
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
                const symbol = cols[0]; // Symbol is always first column
                if (symbol) {
                    existingData.set(symbol, cols);
                }
            }
        }
    } else {
        // If My_Track doesn't exist, create default columns
        allColumns = ['Symbol', 'Series', 'date', 'New52WHprice'];
    }

    // Ensure all required columns are present in header
    const requiredCols = ['Symbol', 'Series', 'date', 'New52WHprice'];
    for (const reqCol of requiredCols) {
        if (!allColumns.includes(reqCol)) {
            allColumns.push(reqCol);
        }
    }

    // Get column indices for My_Track
    const symIdx = allColumns.indexOf('Symbol');
    const seriesIdx = allColumns.indexOf('Series');
    const dateIdx = allColumns.indexOf('date');
    const priceIdx = allColumns.indexOf('New52WHprice');

    // ---- Read 52WeekHigh.csv file ----
    const raw = fs.readFileSync(SRC_FILE, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean);

    const headers = parse(raw[0]!);
    const srcSymIdx = headers.findIndex(h => h.toLowerCase().includes('symbol'));
    const srcSerIdx = headers.findIndex(h => h.toLowerCase().includes('series'));
    const highIdx = headers.findIndex(h => h.toLowerCase().includes('new 52w/h price'));

    expect([srcSymIdx, srcSerIdx, highIdx]).not.toContain(-1);

    // ---- Process source rows (Task 1: Add new entries with current date) ----
    let addedCount = 0;
    const finalData = new Map<string, string[]>();

    // First, copy all existing data to finalData
    for (const [sym, cols] of existingData) {
        // Ensure the row has enough columns
        while (cols.length < allColumns.length) {
            cols.push('');
        }
        finalData.set(sym, cols);
    }

    // Process each stock from 52WeekHigh.csv
    for (let i = 1; i < raw.length; i++) {
        const cols = parse(raw[i]!);
        const sym = cols[srcSymIdx];
        const series = cols[srcSerIdx];
        const newPriceStr = cols[highIdx];

        if (!sym || !newPriceStr) continue;

        // Task 1: If it's new (no entry in My_Track for that Symbol), add entry with current date
        if (!finalData.has(sym)) {
            // New symbol - create a new row with all columns
            const newRow = new Array(allColumns.length).fill('');
            newRow[symIdx] = sym;
            newRow[seriesIdx] = series;
            newRow[dateIdx] = TODAY;
            newRow[priceIdx] = newPriceStr;
            finalData.set(sym, newRow);
            addedCount++;
            console.log(`➕ Added new stock: ${sym} with 52W/H price ${newPriceStr} on ${TODAY}`);
        }
    }

    // ---- Write back to My_Track.csv ----
    const header = allColumns.join(',') + '\n';
    const rows: string[] = [];

    for (const [sym, data] of finalData) {
        rows.push(data.join(','));
    }

    const fileContent = header + rows.join('\n') + (rows.length ? '\n' : '');
    fs.writeFileSync(DEST_FILE, fileContent);

    // ---- Log results ----
    console.log(`\n✅ Processed ${raw.length - 1} source rows from 52WeekHigh.csv.`);
    console.log(`   📝 Added: ${addedCount} new stocks with current date (${TODAY}).`);
    console.log(`   📊 Total stocks in My_Track.csv: ${finalData.size}`);
    console.log(`   📋 Preserved ${allColumns.length} columns including any manually added ones.`);
    console.log(`\n🎯 My_Track.csv updated successfully at: ${DEST_FILE}`);
});