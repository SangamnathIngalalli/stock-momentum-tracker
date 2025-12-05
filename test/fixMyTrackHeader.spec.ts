// tests/fixMyTrackHeader.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const MY_TRACK_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;

test('verify My_Track.xlsx header integrity', async () => {
    expect(fs.existsSync(MY_TRACK_FILE), `My_Track.xlsx not found: ${MY_TRACK_FILE}`).toBeTruthy();

    // Read the Excel file
    const workbook = XLSX.readFile(MY_TRACK_FILE);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        console.log('⚠️  My_Track.xlsx has no sheets!');
        return;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        console.log('⚠️  Worksheet not found in Excel file!');
        return;
    }
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (data.length === 0) {
        console.log('⚠️  My_Track.xlsx is empty!');
        return;
    }

    // Define expected header columns
    const expectedHeaders = ['Symbol', 'Series', 'date', 'New52WHprice'];

    // Check if first row contains expected headers
    const firstRow = data[0];
    if (!firstRow) {
        console.log('⚠️  Could not read first row.');
        return;
    }

    const firstRowCols = firstRow.map((col: any) => String(col || ''));
    const hasAllHeaders = expectedHeaders.every(header =>
        firstRowCols.some((col: string) => col === header)
    );

    if (hasAllHeaders) {
        console.log('✅ Header is in correct position (first row) and contains all expected columns.');
        console.log(`   Total columns: ${firstRowCols.length}`);
        console.log(`   Columns: ${firstRowCols.join(', ')}`);
    } else {
        console.log('⚠️  WARNING: Some expected headers are missing from the first row.');
        console.log(`   Expected: ${expectedHeaders.join(', ')}`);
        console.log(`   Found: ${firstRowCols.join(', ')}`);

        // Check which headers are missing
        const missingHeaders = expectedHeaders.filter(header =>
            !firstRowCols.some((col: string) => col === header)
        );
        console.log(`   Missing headers: ${missingHeaders.join(', ')}`);
    }

    console.log(`\n📊 Total rows (including header): ${data.length}`);
    console.log(`   Data rows: ${data.length - 1}`);
});
