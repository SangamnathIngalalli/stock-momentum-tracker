
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const MY_TRACK_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;

console.log(`Reading ${MY_TRACK_FILE}...`);
const workbook = XLSX.readFile(MY_TRACK_FILE, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

if (data.length > 0) {
    const header = data[0];
    console.log('Headers:', header);

    const researchDateIdx = header.findIndex((h: any) => String(h).toLowerCase().includes('searchdate'));
    console.log(`ResearchDate Index: ${researchDateIdx}`);

    console.log('First 5 rows:');
    for (let i = 1; i < Math.min(data.length, 6); i++) {
        const row = data[i];
        console.log(`Row ${i}:`);
        console.log(`  Raw Row:`, row);
        if (researchDateIdx !== -1) {
            const dateVal = row[researchDateIdx];
            console.log(`  ResearchDate Value:`, dateVal);
            console.log(`  ResearchDate Type:`, typeof dateVal);
            console.log(`  Is Date instance:`, dateVal instanceof Date);
        }
    }
} else {
    console.log('Empty data');
}
