
const XLSX = require('xlsx');
const filePath = 'C:\\Users\\Administrator\\OneDrive\\Swing Trading\\screener\\Quality Growth Pullback - Positional.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Headers:', data[0]);
    console.log('Sample Row:', data[1]);
} catch (e) {
    console.error(e);
}
