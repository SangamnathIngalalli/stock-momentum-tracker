
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { getMappedSymbol, hasMapping, isIgnored, STOCK_MAPPINGS, IGNORED_SYMBOLS } from './stock_mappings';
import { sanitizeRow } from './utils';

const SOURCE_FILE = `C:\\Users\\Administrator\\OneDrive\\Swing Trading\\screener\\Bull stock with FII Buy.xlsx`;
const TODAY_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\today_price.csv`;

test('update Bull stock with FII Buy tracker', async () => {
    expect(fs.existsSync(SOURCE_FILE), `Source file not found: ${SOURCE_FILE}`).toBeTruthy();
    expect(fs.existsSync(TODAY_CSV), `today_price.csv not found: ${TODAY_CSV}`).toBeTruthy();

    // ---- Backup ----
    const backupDir = `C:\\Users\\Administrator\\OneDrive\\Swing Trading\\screener\\Backup`;
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const fileName = path.basename(SOURCE_FILE).replace('.xlsx', `_backup_${Date.now()}.xlsx`);
    const backupFile = path.join(backupDir, fileName);
    fs.copyFileSync(SOURCE_FILE, backupFile);
    console.log(`📂 Created backup at: ${backupFile}`);

    // ---- Helper function to parse CSV line ----
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

    // ---- Read today's prices from today_price.csv ----
    const closeMap = new Map<string, number>();
    const todayLines = fs.readFileSync(TODAY_CSV, 'utf8')
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    const todayHeaders = parseCSVLine(todayLines[0] || '');
    const securityIdx = todayHeaders.findIndex((h: string) => h.toLowerCase().includes('security'));
    const closePricIdx = todayHeaders.findIndex((h: string) => h.toLowerCase().includes('close_pric'));

    expect([securityIdx, closePricIdx]).not.toContain(-1);

    todayLines.slice(1).forEach(line => {
        const cols = parseCSVLine(line);
        const sym = cols[securityIdx];
        const closeStr = cols[closePricIdx];
        const close = Number(closeStr);
        if (sym && !isNaN(close) && close > 0) {
            closeMap.set(sym, close);
        }
    });

    console.log(`📊 Loaded ${closeMap.size} stock prices from today_price.csv`);

    // ---- Read Bull Stock Excel file ----
    const workbook = XLSX.readFile(SOURCE_FILE);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('No sheets found in Excel file');
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error('Worksheet not found in Excel file');

    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (data.length === 0 || !data[0]) {
        throw new Error('Excel file is empty or has no header');
    }

    const headers = data[0].map((col: any) => String(col || '').trim());

    // Find column indices with better matching
    const findCol = (terms: string[]) => headers.findIndex(h =>
        terms.some(term => h.toLowerCase().includes(term.toLowerCase()))
    );

    let symbolIdx = findCol(['nse name', 'nse(', 'symbol']);
    let highPriceIdx = findCol(['high price']);
    let currentPriceIdx = findCol(['current price']);
    let pcntChangeIdx = findCol(['percentage change', 'pcnt change']);

    // Fallback based on user description (B=1, C=2, D=3, E=4) ONLY if not found
    if (symbolIdx === -1) symbolIdx = 1;
    if (highPriceIdx === -1) highPriceIdx = 2;
    if (currentPriceIdx === -1) currentPriceIdx = 3;
    if (pcntChangeIdx === -1) pcntChangeIdx = 4;

    // CRITICAL: Ensure indices are unique. If they overlap, we have a detection failure.
    const indices = [highPriceIdx, currentPriceIdx, pcntChangeIdx];
    const uniqueIndices = new Set(indices);
    if (uniqueIndices.size !== indices.length) {
        console.log('⚠️ Warning: Overlapping column indices detected. Adjusting to unique slots.');
        // If they overlap, we'll force them to 2, 3, 4 as safe defaults
        if (highPriceIdx === pcntChangeIdx || highPriceIdx === currentPriceIdx) highPriceIdx = 2;
        if (currentPriceIdx === highPriceIdx || currentPriceIdx === pcntChangeIdx) currentPriceIdx = 3;
        if (pcntChangeIdx === highPriceIdx || pcntChangeIdx === currentPriceIdx) pcntChangeIdx = 4;
    }

    // Ensure headers exist at these positions
    if (headers.length <= highPriceIdx) headers[highPriceIdx] = 'high price';
    if (headers.length <= currentPriceIdx) headers[currentPriceIdx] = 'current price';
    if (headers.length <= pcntChangeIdx) headers[pcntChangeIdx] = 'pcnt change';

    console.log(`📍 Column Indices: Symbol=${symbolIdx}, HighPrice=${highPriceIdx}, CurrentPrice=${currentPriceIdx}, PcntChange=${pcntChangeIdx}`);

    // DO NOT filter empty rows to preserve spacing/formatting
    const existingRows = data.slice(1);
    const updatedRows: any[][] = [];

    let updatedCount = 0;
    let newHighCount = 0;
    let notFoundCount = 0;

    for (let row of existingRows) {
        if (!row) continue;

        // Pad row and sanitize data types/dates
        const maxIdx = Math.max(symbolIdx, highPriceIdx, currentPriceIdx, pcntChangeIdx, headers.length - 1);
        while (row.length <= maxIdx) {
            row.push('');
        }

        // Apply robust conversion to preserve original content formats
        row = sanitizeRow(row, headers);

        const rawSym = String(row[symbolIdx] || '').trim();
        if (!rawSym) {
            updatedRows.push(row);
            continue;
        }

        // Handle mappings and exclusions
        let sym = rawSym;
        if (isIgnored(sym)) {
            updatedRows.push(row);
            continue;
        }

        let close = closeMap.get(sym);
        if (close === undefined && hasMapping(sym)) {
            const mappedSym = getMappedSymbol(sym);
            close = closeMap.get(mappedSym);
        }

        if (close !== undefined) {
            let high = Number(row[highPriceIdx]);
            if (isNaN(high) || high === 0) {
                // If high price is 0 or empty, initialize it with today's price
                high = close;
                row[highPriceIdx] = high.toString();
            }

            // 1. Check if today's price is higher than high price
            if (close > high) {
                row[highPriceIdx] = close.toString();
                high = close;
                newHighCount++;
                console.log(`   🚀 NEW HIGH: ${sym} (${high} -> ${close})`);
            }

            // 2. Update current price
            row[currentPriceIdx] = close.toString();

            // 3. Update percentage change
            const pcnt = ((close - high) / high * 100).toFixed(2);
            row[pcntChangeIdx] = pcnt;

            updatedCount++;
        } else {
            notFoundCount++;
        }
        updatedRows.push(row);
    }

    // 4. Sort based on percentage change (most negative first)
    updatedRows.sort((a, b) => {
        const valA = parseFloat(a[pcntChangeIdx]) || 0;
        const valB = parseFloat(b[pcntChangeIdx]) || 0;
        return valA - valB;
    });

    // Write back - PRESERVE ALL SHEETS
    const outputData = [data[0], ...updatedRows];
    const newWorksheet = XLSX.utils.aoa_to_sheet(outputData);
    workbook.Sheets[sheetName] = newWorksheet;
    XLSX.writeFile(workbook, SOURCE_FILE);

    console.log(`\n✅ Finished updating ${SOURCE_FILE}`);
    console.log(`   📈 Total Rows: ${updatedRows.length}`);
    console.log(`   🔄 Updated Prices: ${updatedCount}`);
    console.log(`   🌟 New Highs Hit: ${newHighCount}`);
    console.log(`   ⚠️ Symbols Not Found: ${notFoundCount}`);
});
