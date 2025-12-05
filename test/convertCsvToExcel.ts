// test/convertCsvToExcel.ts
// One-time migration script to convert My_Track.csv to My_Track.xlsx

import * as fs from 'fs';
import * as XLSX from 'xlsx';

const CSV_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.csv`;
const EXCEL_FILE = `C:\\Users\\Administrator\\OneDrive\\check Swing trading\\My_Track.xlsx`;

// Helper function to parse CSV line (handles quoted fields)
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

console.log('🔄 Starting CSV to Excel conversion...\n');

// Check if CSV file exists
if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ ERROR: CSV file not found at: ${CSV_FILE}`);
    process.exit(1);
}

// Check if Excel file already exists
if (fs.existsSync(EXCEL_FILE)) {
    console.log(`⚠️  WARNING: Excel file already exists at: ${EXCEL_FILE}`);
    console.log(`   The existing file will be overwritten.\n`);
}

// Read CSV file
console.log(`📖 Reading CSV file: ${CSV_FILE}`);
const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

console.log(`   Found ${lines.length} lines (including header)\n`);

// Parse CSV into array of arrays
const data: string[][] = [];
for (const line of lines) {
    const cols = parseCSVLine(line);
    data.push(cols);
}

// Display header information
if (data.length > 0 && data[0]) {
    console.log(`📋 Header columns (${data[0].length} total):`);
    data[0].forEach((col, idx) => {
        console.log(`   ${idx + 1}. ${col}`);
    });
    console.log('');
}

// Create workbook and worksheet
console.log('📊 Creating Excel workbook...');
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'My_Track');

// Write Excel file
console.log(`💾 Writing Excel file: ${EXCEL_FILE}`);
XLSX.writeFile(workbook, EXCEL_FILE);

console.log('\n✅ Conversion completed successfully!');
console.log(`   📁 CSV file: ${CSV_FILE}`);
console.log(`   📁 Excel file: ${EXCEL_FILE}`);
console.log(`   📊 Total rows: ${data.length - 1} (excluding header)`);
console.log(`   📋 Total columns: ${data[0]?.length || 0}`);
console.log('\n🎯 Your CSV file has been preserved. You can now use the Excel file with the updated scripts.');
