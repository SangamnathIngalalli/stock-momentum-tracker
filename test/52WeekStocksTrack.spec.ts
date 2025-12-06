import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { IGNORED_SYMBOLS } from './stock_mappings';

const SRC_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\52WeekHigh.csv`;
const DEST_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;

const TODAY = new Date().toLocaleDateString('en-US'); // M/D/YYYY format

test('update My_Track with new 52-week high stocks', async () => {
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

    // ---- Verify source file exists ----
    expect(fs.existsSync(SRC_FILE), `Source file not found: ${SRC_FILE}`).toBeTruthy();

    // ---- Read existing My_Track data from Excel ----
    let allColumns: string[] = [];
    // Store rows as arrays to preserve duplicate column names
    let existingRows: string[][] = [];

    if (fs.existsSync(DEST_FILE)) {
        const workbook = XLSX.readFile(DEST_FILE, { cellDates: true });
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

        if (data.length > 0 && data[0]) {
            // Read existing header to preserve ALL columns including duplicates
            allColumns = data[0].map((col: any) => String(col || ''));

            // Parse existing data rows as arrays
            for (let i = 1; i < data.length; i++) {
                const rowData = data[i];
                if (!rowData) continue;
                const row = rowData.map((cell: any) => {
                    if (cell instanceof Date) {
                        return cell.toLocaleDateString('en-US');
                    }
                    return String(cell || '');
                });
                // Pad with empty strings if row is shorter than header
                while (row.length < allColumns.length) {
                    row.push('');
                }
                existingRows.push(row);
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

    // Find column indices
    const symbolIdx = allColumns.findIndex((col: string) => col === 'Symbol');
    const seriesIdx = allColumns.findIndex((col: string) => col === 'Series');
    const dateIdx = allColumns.findIndex((col: string) => col === 'date');
    const new52WHIdx = allColumns.findIndex((col: string) => col === 'New52WHprice');

    // ---- Read 52WeekHigh.csv file ----
    const rawContent = fs.readFileSync(SRC_FILE, 'utf8');
    const rawLines = rawContent.split(/\r?\n/).filter(line => line.trim() !== '');

    const srcHeaders = parseCSVLine(rawLines[0] || '');
    const srcSymIdx = srcHeaders.findIndex(h => h.toLowerCase().includes('symbol'));
    const srcSerIdx = srcHeaders.findIndex(h => h.toLowerCase().includes('series'));
    const highIdx = srcHeaders.findIndex(h => h.toLowerCase().includes('new 52w/h price'));

    expect([srcSymIdx, srcSerIdx, highIdx]).not.toContain(-1);

    // ---- Process source rows ----
    let addedCount = 0;

    // Build a set of existing Symbols to avoid adding if it ALREADY exists (regardless of date)
    const existingEntries = new Set<string>();
    existingRows.forEach((row: string[]) => {
        const sym = row[symbolIdx];
        if (sym) {
            existingEntries.add(sym);
        }
    });

    // Process each stock from 52WeekHigh.csv
    for (let i = 1; i < rawLines.length; i++) {
        const cols = parseCSVLine(rawLines[i] || '');
        const sym = cols[srcSymIdx];
        const series = cols[srcSerIdx];
        const newPriceStr = cols[highIdx];

        if (!sym || !newPriceStr) continue;

        // Check if symbol should be ignored
        if (IGNORED_SYMBOLS.includes(sym)) {
            console.log(`🚫 Ignored symbol: ${sym}`);
            continue;
        }

        // Check if we already have this symbol (strict duplicate check)
        if (existingEntries.has(sym)) {
            // Already tracked, skip
            continue;
        }

        // Add new row - initialize with empty strings for all columns
        const newRow: string[] = new Array(allColumns.length).fill('');

        // Set specific values
        newRow[symbolIdx] = sym;
        newRow[seriesIdx] = series || '';
        newRow[dateIdx] = TODAY;
        newRow[new52WHIdx] = newPriceStr;

        existingRows.push(newRow);
        existingEntries.add(sym); // Prevent adding it again in this loop
        addedCount++;
    }

    // ---- Write back to My_Track.xlsx ----
    // Prepare data as array of arrays (header + rows)
    const outputData: any[][] = [allColumns];

    for (const row of existingRows) {
        // Ensure row has all columns
        while (row.length < allColumns.length) {
            row.push('');
        }
        outputData.push(row);
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(outputData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My_Track');

    // Write Excel file
    XLSX.writeFile(workbook, DEST_FILE);

    // ---- Log results ----
    console.log(`\n✅ Processed ${rawLines.length - 1} source rows from 52WeekHigh.csv.`);
    console.log(`   📝 Added: ${addedCount} new stocks with current date (${TODAY}).`);
    console.log(`   📊 Total rows in My_Track.xlsx: ${existingRows.length}`);
    console.log(`   📋 Preserved ${allColumns.length} columns`);
    console.log(`\n🎯 My_Track.xlsx updated successfully at: ${DEST_FILE}`);
});