// tests/updateCurrentPrice.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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

    console.log(`📊 Loaded ${closeMap.size} stock prices from today_price.csv`);

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
    let notFoundCount = 0;

    myTrackLines.slice(1).forEach(line => {
        const cols = parse(line);

        // Ensure array has enough elements for all columns
        while (cols.length < updatedHeader.length) {
            cols.push('');
        }

        const sym = cols[symIdx];
        const whStr = cols[whPriceIdx] || '';
        const wh = Number(whStr);

        // Task 1: Update CurrentPrice from today_price.csv
        const close = closeMap.get(sym!);
        if (close !== undefined) {
            cols[currentPriceIdx] = close.toString();
            // Task 2: Calculate PcntChange = ((CurrentPrice - New52WHprice) / New52WHprice) * 100
            const pcnt = ((close - wh) / wh * 100).toFixed(2);
            cols[pcntChangeIdx] = pcnt;
            updatedCount++;
        } else {
            // If stock not found in today_price.csv, keep existing value or use New52WHprice
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

    console.log(`\n✅ Updated My_Track.csv with latest prices.`);
    console.log(`   📈 Updated: ${updatedCount} stocks with price from today_price.csv`);
    console.log(`   ⚠️  Not found: ${notFoundCount} stocks (kept existing price or used New52WHprice)`);
    console.log(`   📊 Total stocks: ${rowsOut.length - 1}`);
    console.log(`   📋 Preserved ${updatedHeader.length} columns including any manually added ones.`);
    console.log(`\n🎯 My_Track.csv updated successfully at: ${MY_TRACK_CSV}`);
});