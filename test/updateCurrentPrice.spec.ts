// tests/updateCurrentPrice.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STOCKS_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\52-week-high\\stocks.csv`;
const TODAY_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\today_price.csv`;

test('update stocks.csv with latest close price & % change', async () => {
    expect(fs.existsSync(STOCKS_CSV)).toBeTruthy();
    expect(fs.existsSync(TODAY_CSV)).toBeTruthy();

    const parse = (line: string) => line.split(',').map(c => c.trim());

    // ---- index today's close prices ----
    const closeMap = new Map<string, number>();
    fs.readFileSync(TODAY_CSV, 'utf8')
        .split(/\r?\n/)
        .slice(1)
        .filter(Boolean)
        .forEach(line => {
            const [sym, , closeStr] = parse(line); // 1st=SYMBOL, 3rd=CLOSE_PRIC
            const close = Number(closeStr);
            if (sym && !isNaN(close)) closeMap.set(sym, close);
        });

    // ---- Read existing stocks.csv to preserve all columns ----
    const stocksLines = fs.readFileSync(STOCKS_CSV, 'utf8').split(/\r?\n/).filter(Boolean);
    const existingHeader = stocksLines[0]!;
    const headerCols = parse(existingHeader);

    // Find column indices
    const symIdx = headerCols.indexOf('Symbol');
    const seriesIdx = headerCols.indexOf('Series');
    const dateIdx = headerCols.indexOf('date');
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

    // ---- rebuild stocks rows, preserving all columns ----
    const rowsOut: string[] = [updatedHeader.join(',')];

    stocksLines.slice(1).forEach(line => {
        const cols = parse(line);

        // Ensure array has enough elements for all columns
        while (cols.length < updatedHeader.length) {
            cols.push('');
        }

        const sym = cols[symIdx];
        const whStr = cols[whPriceIdx];
        const wh = Number(whStr);
        const close = closeMap.get(sym) ?? wh;
        const pcnt = ((close - wh) / wh * 100).toFixed(2);

        // Update only the CurrentPrice and PcntChange columns
        cols[currentPriceIdx] = close.toString();
        cols[pcntChangeIdx] = pcnt;

        rowsOut.push(cols.join(','));
    });

    // ---- overwrite ----
    fs.writeFileSync(STOCKS_CSV, rowsOut.join('\n') + '\n');
    console.log(`✅ Updated ${rowsOut.length - 1} stocks with latest price.`);
    console.log(`📋 Preserved ${updatedHeader.length} columns including any manually added ones.`);
});