// tests/updateCurrentPrice.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { getMappedSymbol, hasMapping, isIgnored, STOCK_MAPPINGS, IGNORED_SYMBOLS } from './stock_mappings';

const MY_TRACK_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;
const TODAY_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\today_price.csv`;

test('update My_Track.xlsx with latest close price & % change', async () => {
    expect(fs.existsSync(MY_TRACK_FILE), `My_Track.xlsx not found: ${MY_TRACK_FILE}`).toBeTruthy();
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

    // ---- index today's close prices from today_price.csv ----
    const closeMap = new Map<string, number>();
    const todayLines = fs.readFileSync(TODAY_CSV, 'utf8')
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    // Find column indices in today_price.csv
    const todayHeaders = parseCSVLine(todayLines[0] || '');
    const securityIdx = todayHeaders.findIndex((h: string) => h.toLowerCase().includes('security'));
    const closePricIdx = todayHeaders.findIndex((h: string) => h.toLowerCase().includes('close_pric'));

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

    // ---- Read existing My_Track.xlsx to preserve all columns ----
    const workbook = XLSX.readFile(MY_TRACK_FILE);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('No sheets found in Excel file');
    }
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error('Worksheet not found in Excel file');
    }

    // Convert to array of arrays to preserve duplicate columns
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (data.length === 0 || !data[0]) {
        throw new Error('Excel file is empty or has no header');
    }

    // Parse headers - preserve ALL columns including duplicates
    const allColumns = data[0].map((col: any) => String(col || ''));
    const originalColumnCount = allColumns.length;

    // Find or add CurrentPrice and PcntChange columns
    const symbolIdx = allColumns.findIndex((col: string) => col === 'Symbol');
    const new52WHIdx = allColumns.findIndex((col: string) => col === 'New52WHprice');
    let currentPriceIdx = allColumns.findIndex((col: string) => col === 'CurrentPrice');
    let pcntChangeIdx = allColumns.findIndex((col: string) => col === 'PcntChange');

    if (currentPriceIdx === -1) {
        currentPriceIdx = allColumns.length;
        allColumns.push('CurrentPrice');
    }
    if (pcntChangeIdx === -1) {
        pcntChangeIdx = allColumns.length;
        allColumns.push('PcntChange');
    }

    // Parse all rows - store as arrays to preserve duplicate columns
    const existingRows: string[][] = [];

    for (let i = 1; i < data.length; i++) {
        const rowData = data[i];
        if (!rowData) continue;
        const cols = rowData.map((cell: any) => String(cell || ''));
        // Pad with empty strings if row is shorter than header
        while (cols.length < allColumns.length) {
            cols.push('');
        }
        existingRows.push(cols);
    }

    // ---- Update rows ----
    let updatedCount = 0;
    let mappedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    const notFoundSymbols: string[] = [];
    const failedMappings: { original: string, mapped: string }[] = [];

    for (const row of existingRows) {
        const sym = row[symbolIdx];
        const whStr = row[new52WHIdx] || '';
        const wh = Number(whStr);

        if (!sym) continue;

        // Check if symbol is ignored
        if (isIgnored(sym)) {
            skippedCount++;
            // Ensure fields exist even if skipped
            if (!row[currentPriceIdx]) row[currentPriceIdx] = whStr;
            if (!row[pcntChangeIdx]) row[pcntChangeIdx] = '0.00';
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
            row[currentPriceIdx] = close.toString();
            // Calculate % change
            if (wh > 0) {
                const pcnt = ((close - wh) / wh * 100).toFixed(2);
                row[pcntChangeIdx] = pcnt;
            } else {
                row[pcntChangeIdx] = '0.00';
            }
            updatedCount++;
        } else {
            notFoundSymbols.push(sym);
            // Keep existing or use New52WHprice
            if (!row[currentPriceIdx]) {
                row[currentPriceIdx] = whStr;
            }

            const currentPrice = Number(row[currentPriceIdx] || whStr);
            if (wh > 0) {
                const pcnt = ((currentPrice - wh) / wh * 100).toFixed(2);
                row[pcntChangeIdx] = pcnt;
            } else {
                row[pcntChangeIdx] = '0.00';
            }
            notFoundCount++;
        }
    }

    // ---- Write back to My_Track.xlsx ----
    const outputData: any[][] = [allColumns];

    for (const row of existingRows) {
        // Ensure row has all columns
        while (row.length < allColumns.length) {
            row.push('');
        }
        outputData.push(row);
    }

    // Create workbook and worksheet
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(outputData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'My_Track');

    // Write Excel file
    XLSX.writeFile(newWorkbook, MY_TRACK_FILE);

    // ---- Display Results ----
    console.log(`\n✅ Updated My_Track.xlsx with latest prices.`);
    console.log(`   📈 Updated: ${updatedCount} stocks`);
    console.log(`   🗺️  Via mapping: ${mappedCount} stocks`);
    console.log(`   🚫 Skipped: ${skippedCount} ignored stocks`);
    console.log(`   ⚠️  Not found: ${notFoundCount} stocks`);
    console.log(`   📊 Total rows: ${existingRows.length}`);
    console.log(`   📋 Preserved ${allColumns.length} columns (${originalColumnCount} original + ${allColumns.length - originalColumnCount} added)`);

    if (failedMappings.length > 0) {
        console.log(`\n❌ ERROR: ${failedMappings.length} mappings FAILED.`);
    }

    if (notFoundSymbols.length > 0) {
        console.log(`\n⚠️  WARNING: ${notFoundSymbols.length} symbols NOT found in today_price.csv.`);
        notFoundSymbols.forEach(s => console.log(`   🔸 ${s}`));
    } else {
        console.log(`\n✅ All symbols found and updated successfully!`);
    }

    console.log(`\n🎯 My_Track.xlsx updated successfully at: ${MY_TRACK_FILE}`);
});