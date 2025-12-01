import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const MY_TRACK_CSV = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.csv`;

test('verify all columns are preserved in My_Track.csv', async () => {
    const parse = (line: string) => line.split(',').map(c => c.trim());

    // Read My_Track.csv
    const lines = fs.readFileSync(MY_TRACK_CSV, 'utf8').split(/\r?\n/).filter(Boolean);
    const header = parse(lines[0]!);

    console.log('\n📋 Current columns in My_Track.csv:');
    header.forEach((col, idx) => {
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
    manualColumns.forEach(col => {
        const exists = header.includes(col);
        console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'PRESERVED' : 'MISSING'}`);
        expect(exists, `Column "${col}" should be preserved`).toBeTruthy();
    });

    // Check a sample row to ensure data integrity
    if (lines.length > 1) {
        const sampleRow = parse(lines[1]!);
        console.log(`\n📊 Sample row has ${sampleRow.length} values for ${header.length} columns`);
        console.log(`   Data integrity: ${sampleRow.length >= header.length ? '✅ GOOD' : '❌ MISMATCH'}`);
    }
});
