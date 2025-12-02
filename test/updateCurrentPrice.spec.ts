// tests/updateCurrentPrice.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getMappedSymbol, hasMapping, isIgnored, STOCK_MAPPINGS, IGNORED_SYMBOLS } from './stock_mappings';

const MY_TRACK_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.csv`;
const TODAY_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\today_price.csv`;

test('update My_Track.csv with latest close price & % change', async () => {
    expect(fs.existsSync(MY_TRACK_CSV), `My_Track.csv not found: ${MY_TRACK_CSV}`).toBeTruthy();
    expect(fs.existsSync(TODAY_CSV), `today_price.csv not found: ${TODAY_CSV}`).toBeTruthy();

    const parse = (line: string) => line.split(',').map(c => c.trim());

    // ---- index today's close prices from today_price.csv ----
    const closeMap = new Map<string, number>();
    const todayLines = fs.readFileSync(TODAY_CSV, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean);

    // Find column indices in today_price.csv
    const todayHeaders = parse(todayLines[0]!);
    const securityIdx = todayHeaders.findIndex(h => h.toLowerCase().includes('security'));
    const closePricIdx = todayHeaders.findIndex(h => h.toLowerCase().includes('close_pric'));

    expect([securityIdx, closePricIdx]).not.toContain(-1);

    // Parse today_price.csv and build price map
    todayLines.slice(1).forEach(line => {
        const cols = parse(line);
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
    // Check if all mapped target symbols actually exist in today_price.csv
    const brokenMappings: string[] = [];
    for (const [original, mapped] of Object.entries(STOCK_MAPPINGS)) {
        if (!closeMap.has(mapped)) {
            brokenMappings.push(`${original} -> '${mapped}'`);
        }
    }

    if (brokenMappings.length > 0) {
        console.log(`\n⚠️  MAPPING HEALTH CHECK: Found ${brokenMappings.length} potentially broken mappings.`);
        console.log(`   (These target symbols are defined in stock_mappings.ts but NOT found in today_price.csv)`);
        console.log(`   (This might be due to name changes in today_price.csv or delisted stocks)`);
        brokenMappings.slice(0, 10).forEach(m => console.log(`   🔸 ${m}`));
        if (brokenMappings.length > 10) console.log(`   ... and ${brokenMappings.length - 10} more.`);
        console.log(`   ────────────────────────────────────────────────────────────`);
    }

    // ---- Read existing My_Track.csv to preserve all columns ----
    const myTrackLines = fs.readFileSync(MY_TRACK_CSV, 'utf8').split(/\r?\n/).filter(Boolean);
    const existingHeader = myTrackLines[0]!;
    const headerCols = parse(existingHeader);

    // Find column indices in My_Track
    const symIdx = headerCols.indexOf('Symbol');
    const whPriceIdx = headerCols.indexOf('New52WHprice');
    let currentPriceIdx = headerCols.indexOf('CurrentPrice');
    let pcntChangeIdx = headerCols.indexOf('PcntChange');

    // If CurrentPrice or PcntChange columns don't exist, add them to header
    let updatedHeader = headerCols.slice();
    if (currentPriceIdx === -1) {
        updatedHeader.push('CurrentPrice');
        currentPriceIdx = updatedHeader.length - 1;
    }
    if (pcntChangeIdx === -1) {
        updatedHeader.push('PcntChange');
        pcntChangeIdx = updatedHeader.length - 1;
    }

    // ---- rebuild My_Track rows, preserving all columns ----
    const rowsOut: string[] = [updatedHeader.join(',')];
    let updatedCount = 0;
    let mappedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    const notFoundSymbols: string[] = []; // Track symbols not found even after mapping
    const failedMappings: { original: string, mapped: string }[] = []; // Track mappings that didn't work

    myTrackLines.slice(1).forEach(line => {
        const cols = parse(line);

        // Ensure array has enough elements for all columns
        while (cols.length < updatedHeader.length) {
            cols.push('');
        }

        const sym = cols[symIdx];
        const whStr = cols[whPriceIdx] || '';
        const wh = Number(whStr);

        // Check if symbol is ignored
        if (sym && isIgnored(sym)) {
            skippedCount++;
            // Keep existing values, don't update
            if (!cols[currentPriceIdx] || cols[currentPriceIdx] === '') {
                cols[currentPriceIdx] = whStr;
            }
            rowsOut.push(cols.join(','));
            return;
        }

        // Task 1: Update CurrentPrice from today_price.csv
        // First, try to find the symbol directly
        let close = closeMap.get(sym!);
        let usedMapping = false;

        // If not found, try using the mapping
        if (close === undefined && hasMapping(sym!)) {
            const mappedSym = getMappedSymbol(sym!);
            close = closeMap.get(mappedSym);
            if (close !== undefined) {
                usedMapping = true;
                mappedCount++;
            } else {
                // Mapping exists but target symbol not found in today_price.csv
                failedMappings.push({ original: sym!, mapped: mappedSym });
            }
        }

        if (close !== undefined) {
            cols[currentPriceIdx] = close.toString();
            // Task 2: Calculate PcntChange = ((CurrentPrice - New52WHprice) / New52WHprice) * 100
            const pcnt = ((close - wh) / wh * 100).toFixed(2);
            cols[pcntChangeIdx] = pcnt;
            updatedCount++;
        } else {
            // Symbol NOT found in today_price.csv (even after checking mapping)
            notFoundSymbols.push(sym!);

            // Keep existing value or use New52WHprice
            if (!cols[currentPriceIdx] || cols[currentPriceIdx] === '') {
                cols[currentPriceIdx] = whStr;
            }
            const currentPrice = Number(cols[currentPriceIdx] || whStr);
            const pcnt = ((currentPrice - wh) / wh * 100).toFixed(2);
            cols[pcntChangeIdx] = pcnt;
            notFoundCount++;
        }

        rowsOut.push(cols.join(','));
    });

    // ---- overwrite My_Track.csv ----
    fs.writeFileSync(MY_TRACK_CSV, rowsOut.join('\n') + '\n');

    // ---- Display Results ----
    console.log(`\n✅ Updated My_Track.csv with latest prices.`);
    console.log(`   📈 Updated: ${updatedCount} stocks with price from today_price.csv`);
    console.log(`   🗺️  Via mapping: ${mappedCount} stocks found using symbol mappings`);
    console.log(`   🚫 Skipped: ${skippedCount} ignored stocks`);
    console.log(`   ⚠️  Not found: ${notFoundCount} stocks (kept existing price or used New52WHprice)`);
    console.log(`   📊 Total stocks: ${rowsOut.length - 1}`);
    console.log(`   📋 Preserved ${updatedHeader.length} columns including any manually added ones.`);

    // ---- RCA: Report Failed Mappings (Priority Issue) ----
    if (failedMappings.length > 0) {
        console.log(`\n❌ ERROR: The following ${failedMappings.length} symbol mapping(s) FAILED:`);
        console.log(`   (Mapping exists in stock_mappings.ts, but the TARGET symbol was not found in today_price.csv)`);
        console.log(`   ════════════════════════════════════════════════════════════`);
        failedMappings.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.original} ➡️  '${item.mapped}' (Not Found)`);
        });
        console.log(`   ════════════════════════════════════════════════════════════`);
        console.log(`   💡 Suggestion: Check for typos in the TARGET symbol name in stock_mappings.ts`);
    }

    // ---- RCA: List symbols not found in today_price.csv (even after mapping) ----
    if (notFoundSymbols.length > 0) {
        console.log(`\n⚠️  WARNING: The following ${notFoundSymbols.length} symbol(s) were NOT found in today_price.csv:`);
        console.log(`   (These symbols were checked against mappings but still not found)`);
        console.log(`   ════════════════════════════════════════════════════════════`);
        notFoundSymbols.forEach((symbol, index) => {
            console.log(`   ${index + 1}. ${symbol}`);
        });
        console.log(`   ════════════════════════════════════════════════════════════`);
        console.log(`   💡 RCA Suggestions:`);
        console.log(`      - Add mapping in test/stock_mappings.ts for these symbols`);
        console.log(`      - Add to IGNORED_SYMBOLS in test/stock_mappings.ts if they should be skipped`);
        console.log(`      - Check if symbol names match exactly (case-sensitive)`);
        console.log(`      - Verify today_price.csv contains all stocks`);
    } else {
        console.log(`\n✅ All symbols found and updated successfully!`);
    }

    console.log(`\n🎯 My_Track.csv updated successfully at: ${MY_TRACK_CSV}`);
});