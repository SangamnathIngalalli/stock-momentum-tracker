import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getMappedSymbol, hasMapping, isIgnored, STOCK_MAPPINGS, IGNORED_SYMBOLS } from './stock_mappings';

const MY_TRACK_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.csv`;
const TODAY_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\today_price.csv`;

test('update My_Track.csv with latest close price & % change', async () => {
    expect(fs.existsSync(MY_TRACK_CSV), `My_Track.csv not found: ${MY_TRACK_CSV}`).toBeTruthy();
    expect(fs.existsSync(TODAY_CSV), `today_price.csv not found: ${TODAY_CSV}`).toBeTruthy();

    // ---- Helper function to parse CSV line (handles quoted fields) ----
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // ---- Helper to escape CSV fields ----
    const escapeCSV = (field: string): string => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    };

    // ---- index today's close prices from today_price.csv ----
    const closeMap = new Map<string, number>();
    const todayLines = fs.readFileSync(TODAY_CSV, 'utf8')
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    // Find column indices in today_price.csv
    const todayHeaders = parseCSVLine(todayLines[0]);
    const securityIdx = todayHeaders.findIndex(h => h.toLowerCase().includes('security'));
    const closePricIdx = todayHeaders.findIndex(h => h.toLowerCase().includes('close_pric'));

    expect([securityIdx, closePricIdx]).not.toContain(-1);

    // Parse today_price.csv and build price map
    todayLines.slice(1).forEach(line => {
        const cols = parseCSVLine(line);
        const sym = cols[securityIdx];
        const closeStr = cols[closePricIdx];
        const close = Number(closeStr);
        if (sym && !isNaN(close) && close > 0) {
            closeMap.set(sym, close);
        }
    });

    const mappingCount = Object.keys(STOCK_MAPPINGS).length;
    const ignoredCountTotal = IGNORED_SYMBOLS.length;
    console.log(`📊 Loaded ${closeMap.size} stock prices from today_price.csv`);
    console.log(`🗺️  Loaded ${mappingCount} symbol mappings from stock_mappings.ts`);
    console.log(`🚫 Loaded ${ignoredCountTotal} ignored symbols from stock_mappings.ts`);

    // ---- Proactive Mapping Health Check ----
    const brokenMappings: string[] = [];
    for (const [original, mapped] of Object.entries(STOCK_MAPPINGS)) {
        if (!closeMap.has(mapped)) {
            brokenMappings.push(`${original} -> '${mapped}'`);
        }
    }

    if (brokenMappings.length > 0) {
        console.log(`\n⚠️  MAPPING HEALTH CHECK: Found ${brokenMappings.length} potentially broken mappings.`);
        brokenMappings.slice(0, 10).forEach(m => console.log(`   🔸 ${m}`));
        if (brokenMappings.length > 10) console.log(`   ... and ${brokenMappings.length - 10} more.`);
    }

    // ---- Read existing My_Track.csv to preserve all columns ----
    const myTrackContent = fs.readFileSync(MY_TRACK_CSV, 'utf8');
    const myTrackLines = myTrackContent.split(/\r?\n/).filter(line => line.trim() !== '');

    let allColumns = parseCSVLine(myTrackLines[0]);

    // Ensure CurrentPrice and PcntChange columns exist
    if (!allColumns.includes('CurrentPrice')) allColumns.push('CurrentPrice');
    if (!allColumns.includes('PcntChange')) allColumns.push('PcntChange');

    // Parse all rows into Maps to preserve data
    const existingRows: Map<string, string>[] = [];

    // Use the header from the file (myTrackLines[0]) to map correctly
    const fileHeaders = parseCSVLine(myTrackLines[0]);

    for (let i = 1; i < myTrackLines.length; i++) {
        const cols = parseCSVLine(myTrackLines[i]);
        const rowMap = new Map<string, string>();

        fileHeaders.forEach((colName, idx) => {
            rowMap.set(colName, cols[idx] || '');
        });

        existingRows.push(rowMap);
    }

    // ---- Update rows ----
    let updatedCount = 0;
    let mappedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    const notFoundSymbols: string[] = [];
    const failedMappings: { original: string, mapped: string }[] = [];

    for (const row of existingRows) {
        const sym = row.get('Symbol');
        const whStr = row.get('New52WHprice') || '';
        const wh = Number(whStr);

        if (!sym) continue;

        // Check if symbol is ignored
        if (isIgnored(sym)) {
            skippedCount++;
            // Ensure fields exist even if skipped
            if (!row.has('CurrentPrice')) row.set('CurrentPrice', whStr);
            if (!row.has('PcntChange')) row.set('PcntChange', '0.00');
            continue;
        }

        // Try to find price
        let close = closeMap.get(sym);

        // If not found, try mapping
        if (close === undefined && hasMapping(sym)) {
            const mappedSym = getMappedSymbol(sym);
            close = closeMap.get(mappedSym);
            if (close !== undefined) {
                mappedCount++;
            } else {
                failedMappings.push({ original: sym, mapped: mappedSym });
            }
        }

        if (close !== undefined) {
            row.set('CurrentPrice', close.toString());
            // Calculate % change
            if (wh > 0) {
                const pcnt = ((close - wh) / wh * 100).toFixed(2);
                row.set('PcntChange', pcnt);
            } else {
                row.set('PcntChange', '0.00');
            }
            updatedCount++;
        } else {
            notFoundSymbols.push(sym);
            // Keep existing or use New52WHprice
            if (!row.has('CurrentPrice') || row.get('CurrentPrice') === '') {
                row.set('CurrentPrice', whStr);
            }

            const currentPrice = Number(row.get('CurrentPrice') || whStr);
            if (wh > 0) {
                const pcnt = ((currentPrice - wh) / wh * 100).toFixed(2);
                row.set('PcntChange', pcnt);
            } else {
                row.set('PcntChange', '0.00');
            }
            notFoundCount++;
        }
    }

    // ---- Write back to My_Track.csv ----
    const headerLine = allColumns.map(escapeCSV).join(',');
    const rowsOut: string[] = [];

    for (const rowMap of existingRows) {
        const rowValues = allColumns.map(col => escapeCSV(rowMap.get(col) || ''));
        rowsOut.push(rowValues.join(','));
    }

    const fileContent = headerLine + '\n' + rowsOut.join('\n') + (rowsOut.length ? '\n' : '');
    fs.writeFileSync(MY_TRACK_CSV, fileContent);

    // ---- Display Results ----
    console.log(`\n✅ Updated My_Track.csv with latest prices.`);
    console.log(`   📈 Updated: ${updatedCount} stocks`);
    console.log(`   🗺️  Via mapping: ${mappedCount} stocks`);
    console.log(`   🚫 Skipped: ${skippedCount} ignored stocks`);
    console.log(`   ⚠️  Not found: ${notFoundCount} stocks`);
    console.log(`   📊 Total rows: ${existingRows.length}`);
    console.log(`   📋 Preserved ${allColumns.length} columns: ${allColumns.join(', ')}`);

    if (failedMappings.length > 0) {
        console.log(`\n❌ ERROR: ${failedMappings.length} mappings FAILED.`);
    }

    if (notFoundSymbols.length > 0) {
        console.log(`\n⚠️  WARNING: ${notFoundSymbols.length} symbols NOT found in today_price.csv.`);
        notFoundSymbols.forEach(s => console.log(`   🔸 ${s}`));
    } else {
        console.log(`\n✅ All symbols found and updated successfully!`);
    }

    console.log(`\n🎯 My_Track.csv updated successfully at: ${MY_TRACK_CSV}`);
});