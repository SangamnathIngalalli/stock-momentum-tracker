import * as XLSX from 'xlsx';

/**
 * Robustly validates if a string represents a valid date in M/D/YYYY or M/D/YY format
 * Returns true for "12/6/2025", "1/1/24", etc.
 * Returns false for "123.45", "N/A", etc.
 */
export function isValidDateString(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    // Regex for M/D/YYYY or M/D/YY
    // roughly: 1-2 digits / 1-2 digits / 2 or 4 digits
    return /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(str);
}

/**
 * Formats an Excel cell value into a consistent date string (M/D/YYYY).
 * Handles:
 * 1. Excel Serial Numbers (e.g. 45997) -> using SSF to avoid timezone issues
 * 2. Existing Date Strings (e.g. "12/6/2025") -> preserves them
 * 3. JS Date Objects -> converts to M/D/YYYY
 * 4. Others -> returns as is (stringified)
 */
export function formatExcelDate(value: any): string {
    if (value === null || value === undefined) return '';

    // 1. Handle Excel Serial Numbers (roughly > 35000 is year 1995+)
    if (typeof value === 'number' && value > 35000) {
        // Use SSF (SpreadSheet Format) from xlsx to parse the code deterministically
        // This avoids JS Date timezone randomness (+/- 1 day)
        const dateInfo = XLSX.SSF.parse_date_code(value);
        if (dateInfo) {
            // Return M/D/YYYY
            return `${dateInfo.m}/${dateInfo.d}/${dateInfo.y}`;
        }
    }

    // 2. Handle JS Date objects (if cellDates: true was used or passed in)
    if (value instanceof Date) {
        return value.toLocaleDateString('en-US');
    }

    // 3. Handle Strings
    const strVal = String(value).trim();
    if (isValidDateString(strVal)) {
        return strVal;
    }

    return strVal;
}

/**
 * Iterates over a row and applies date formatting to any column
 * that looks like a date column (heuristically by name).
 */
export function sanitizeRow(row: any[], header: string[]): any[] {
    return row.map((cell, index) => {
        const colName = header[index] || '';
        if (colName.toLowerCase().includes('date')) {
            return formatExcelDate(cell);
        }
        return String(cell || '');
    });
}
