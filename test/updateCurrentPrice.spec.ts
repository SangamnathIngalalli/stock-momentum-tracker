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

    // ---- rebuild stocks rows ----
    // Header updated: EntryDate -> date
    const rowsOut: string[] = ['Symbol,Series,date,New52WHprice,CurrentPrice,PcntChange'];
    fs.readFileSync(STOCKS_CSV, 'utf8')
        .split(/\r?\n/)
        .slice(1)
        .filter(Boolean)
        .forEach(line => {
            const [sym, series, date, whStr] = parse(line);
            const wh = Number(whStr);
            const close = closeMap.get(sym) ?? wh;
            const pcnt = ((close - wh) / wh * 100).toFixed(2);
            rowsOut.push([sym, series, date, whStr, close.toString(), pcnt].join(','));
        });

    // ---- overwrite ----
    fs.writeFileSync(STOCKS_CSV, rowsOut.join('\n') + '\n');
    console.log(`✅ Updated ${rowsOut.length - 1} stocks with latest price.`);
});