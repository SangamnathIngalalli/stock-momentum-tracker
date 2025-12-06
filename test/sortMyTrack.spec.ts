// tests/sortMyTrack.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { sanitizeRow } from './utils';

const MY_TRACK_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;

test('sort My_Track.xlsx by PcntChange (ascending)', async () => {
    expect(fs.existsSync(MY_TRACK_FILE), `My_Track.xlsx not found: ${MY_TRACK_FILE}`).toBeTruthy();

    console.log(`\n🔄 Reading My_Track.xlsx for sorting...`);

    // Read the Excel file
    const workbook = XLSX.readFile(MY_TRACK_FILE); // Reverted cellDates: true
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error('Worksheet not found in Excel file');
    }

    // Convert to array of arrays to preserve all columns and data
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length === 0 || !rawData[0]) {
        console.log('⚠️  My_Track.xlsx is empty or has no header. Nothing to sort.');
        return;
    }

    // Extract header and rows
    const header = rawData[0];
    const dataRows = rawData.slice(1);

    // Sanitize dates - explicitly convert serial numbers to strings using utils
    const rows = dataRows.map(row => sanitizeRow(row, header));

    // Find PcntChange column index
    const pcntChangeIdx = header.findIndex((col: any) =>
        String(col || '').toLowerCase() === 'pcntchange'
    );

    if (pcntChangeIdx === -1) {
        console.log('⚠️  PcntChange column not found. Skipping sort.');
        return;
    }

    console.log(`   Found PcntChange column at index ${pcntChangeIdx}`);
    console.log(`   Sorting ${rows.length} rows...`);

    // Sort rows based on PcntChange (ascending: negative -> positive)
    rows.sort((a: any[], b: any[]) => {
        // Get values, handle undefined/null
        const valAStr = String(a[pcntChangeIdx] || '').replace(/%/g, '').trim();
        const valBStr = String(b[pcntChangeIdx] || '').replace(/%/g, '').trim();

        // Parse numbers
        // Treat empty/invalid as Infinity to push to bottom
        const valA = valAStr === '' ? Infinity : parseFloat(valAStr);
        const valB = valBStr === '' ? Infinity : parseFloat(valBStr);

        const numA = isNaN(valA) ? Infinity : valA;
        const numB = isNaN(valB) ? Infinity : valB;

        return numA - numB;
    });

    // Reconstruct data
    const sortedData = [header, ...rows];

    // Write back to Excel
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(sortedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'My_Track');

    XLSX.writeFile(newWorkbook, MY_TRACK_FILE);

    console.log(`✅ Successfully sorted My_Track.xlsx by PcntChange (ascending).`);

    // Log first few rows to verify
    console.log(`\n📊 Top 5 rows after sorting:`);
    rows.slice(0, 5).forEach((row: any[], i: number) => {
        const sym = row[header.findIndex((c: any) => String(c).toLowerCase() === 'symbol')];
        const pcnt = row[pcntChangeIdx];
        console.log(`   ${i + 1}. ${sym}: ${pcnt}%`);
    });
});
