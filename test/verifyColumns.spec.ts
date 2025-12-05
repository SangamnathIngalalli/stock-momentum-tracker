import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const MY_TRACK_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;

test('verify all columns are preserved in My_Track.xlsx', async () => {
    expect(fs.existsSync(MY_TRACK_FILE), `My_Track.xlsx not found: ${MY_TRACK_FILE}`).toBeTruthy();

    // Read My_Track.xlsx
    const workbook = XLSX.readFile(MY_TRACK_FILE);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error('Worksheet not found in Excel file');
    }
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (data.length === 0 || !data[0]) {
        throw new Error('Excel file is empty or has no header');
    }

    const header = data[0].map((col: any) => String(col || '').trim());

    console.log('\n📋 Current columns in My_Track.xlsx:');
    header.forEach((col: string, idx: number) => {
        console.log(`   ${idx + 1}. ${col}`);
    });

    // Verify manually added columns exist
    const manualColumns = [
        'MyResearch Date',
        'fundamentalScore',
        'status',
        'Reason',
        'Allocation Justification'
    ];

    console.log('\n✅ Checking manually added columns:');
    manualColumns.forEach((col: string) => {
        const exists = header.includes(col);
        console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'PRESERVED' : 'MISSING'}`);
        expect(exists, `Column "${col}" should be preserved`).toBeTruthy();
    });

    // Check a sample row to ensure data integrity
    if (data.length > 1) {
        const sampleRow = data[1];
        if (sampleRow) {
            const sampleRowValues = sampleRow.map((cell: any) => String(cell || ''));
            console.log(`\n📊 Sample row has ${sampleRowValues.length} values for ${header.length} columns`);
            console.log(`   Data integrity: ${sampleRowValues.length >= header.length ? '✅ GOOD' : '❌ MISMATCH'}`);
        }
    }
});
