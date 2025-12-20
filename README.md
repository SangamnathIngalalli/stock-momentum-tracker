# Stock Momentum Tracker

A comprehensive automation tool designed to assist swing traders by tracking stocks that hit their 52-week highs and monitoring their daily price movements. This project uses Playwright for automation and maintains a local Excel database (`My_Track.xlsx`) of tracked stocks with full preservation of manually added columns.

## 🚀 Features

* **52-Week High Tracking**: Automatically reads daily reports of stocks hitting 52-week highs and adds new entries to the master tracking list.
* **Strict Uniqueness**: Ensures strict "Unique Symbol" tracking. If a stock is already in your list (regardless of date), it won't be re-added, preventing duplicates.
* **Price Monitoring**: Updates the current price from daily Bhavcopy `today_price.csv` and calculates percentage changes for all tracked stocks.
* **Screener Stocks Tracking**: Dedicated automation for the custom `screener_stocks.xlsx` list.
* **Smart Sorting**: Automatically sorts your tracking sheets by Percentage Change (Ascending) to highlight underperforming stocks first.
* **Dynamic Column Preservation**: Safeguards **ANY** manually added columns (e.g., WatchList, Score, Notes, ResearchDate) during updates. You can add as many custom columns as you like.
* **Robust Date Handling**: Uses advanced heuristics (via `utils.ts`) to ensure dates (like "12/6/2025") remain stable and aren't converted to Excel serial numbers (e.g., "45997") or shifted by timezones.
* **Sequential Pipeline**: A robust test runner that executes the tracking, updating, and sorting processes in the correct order.

## 🛠️ Prerequisites

* Node.js (v14 or higher)
* npm (Node Package Manager)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SangamnathIngalalli/stock-momentum-tracker.git
   ```
2. Navigate to the project directory:
   ```bash
   cd stock-momentum-tracker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## ⚙️ Configuration

The scripts use hardcoded paths for input and output files, tailored for a specific local environment (OneDrive).

**Important**: Before running, update the file paths in the following files to match your local setup:

* `test/52WeekStocksTrack.spec.ts`:
  * `SRC_FILE`: Path to the daily `52WeekHigh.csv` report
  * `DEST_FILE`: Path to your master `My_Track.xlsx`
* `test/updateCurrentPrice.spec.ts`:
  * `MY_TRACK_FILE`: Path to your master `My_Track.xlsx`
  * `TODAY_CSV`: Path to the daily `today_price.csv`
* `test/sortMyTrack.spec.ts`:
  * `MY_TRACK_FILE`: Path to your master `My_Track.xlsx`

## 📂 Core Script Details

This section explains the purpose and function of the key files in the `test/` directory.

### 1. `test/SequentialTestRunner.ts`
**Role:** The Orchestrator (Pipeline Runner).
*   **Purpose:** To execute the entire workflow in the correct sequence with a single command, ensuring data integrity.
*   **Workflow Stages:**
    1.  **Backup**: Creates a timestamped backup of `My_Track.xlsx` before touching it.
    2.  **Fix Header**: Checks `My_Track.xlsx` to ensure headers are clean.
    3.  **Track 52-Week Highs**: Adds new stocks from the daily report.
    4.  **Update Prices**: Refreshes current prices for all tracked stocks.
    5.  **Sort Results**: Sorts the final list by Percentage Change (Low -> High).
    6.  **Screener Stocks**: Updates prices and momentum for the `screener_stocks.xlsx` file.
*   **Key Feature:** Auto-backup prevents data loss.

### 2. `test/52WeekStocksTrack.spec.ts`
**Role:** The Scout (Finds New Stocks).
*   **Purpose:** Reads the daily `52WeekHigh.csv` report and adds fresh stock ideas to `My_Track.xlsx`.
*   **Key Logic:**
    *   **Uniqueness Check**: Checks if a symbol *already exists* in your file. If found, it skips adding it again.
    *   **Date Handling**: Uses `utils.ts` to ensure "ResearchDate" is preserved correctly.
    *   **Ignored Symbols**: Skips symbols listed in `stock_mappings.ts` (e.g., NIFTYBEES).

### 3. `test/updateCurrentPrice.spec.ts`
**Role:** The Analyst (Updates Data).
*   **Purpose:** Monitors the performance (momentum) of your tracked stocks by updating their latest price.
*   **Key Logic:**
    *   **Price Matching**: Reads `today_price.csv` (Bhavcopy) to find closing prices.
    *   **Stats**: Updates `CurrentPrice`, `New52WHprice` (if a new high is hit), and `PcntChange`.
    *   **Fuzzy Matching**: Uses `stock_mappings.ts` to handle complex name variations (e.g. 'M&M' vs 'MAHINDRA & MAHINDRA').

### 4. `test/sortMyTrack.spec.ts`
**Role:** The Organizer (Sorts List).
*   **Purpose:** Keeps your tracking sheet organized so you see the most critical stocks first.
*   **Key Logic:**
    *   Sorts by `PcntChange` in **Ascending** order (Underperforming -> Outperforming).
    *   Preserves all manual data row-by-row.
    *   **Sanitization**: Re-applies date fixes before saving to ensure sorting didn't break date formats.

### 5. `test/fixMyTrackHeader.spec.ts`
**Role:** The Medic (Fixes Corruption).
*   **Purpose:** Automated check to fix common Excel header corruptions (like empty columns) that happen during manual editing.

### 6. `test/stock_mappings.ts`
**Role:** The Dictionary (Config).
*   **Purpose:** Configuration file for handling stock name discrepancies and rules.
*   **Contents:**
    *   `STOCK_MAPPINGS`: Dictionary mapping 'Your Symbol' -> 'Bhavcopy Symbol'.
    *   `IGNORED_SYMBOLS`: List of symbols to strictly ignore (ETFs, Indices, etc.).
### 7. `test/utils.ts`
**Role:** The Fixer (Date Helper).
*   **Purpose:** A robust utility library for handling Excel data quirks.
*   **Problem Solved**: Excel often stores dates as "General" numbers (e.g., 45997). This converts them back to readable dates ("12/6/2025") using mathematical calculation (`XLSX.SSF`), ensuring 100% stability and no timezone randomness.

### 8. `test/screenerStocks.spec.ts`
**Role:** Market Niche Specialist.
*   **Purpose:** Dedicated tracker for your `screener_stocks.xlsx` bucket.
*   **Features:**
    - Specialized high-price tracking logic.
    - Automatic backup to `screener\Backup` folder.
    - Preserves all manual columns (`my take`, `Techinical`, `score`, `Justification`, etc.).
    - Automatic sorting by % change.


## ▶️ Usage

### Run Screener Stocks Tracker
```bash
npx playwright test test/screenerStocks.spec.ts
```

### Run the Full Pipeline (Recommended)
Use the standard runner for master tracking:
```bash
npx ts-node test/SequentialTestRunner.ts
```

### Run Individual Steps

You can also run each step manually using Playwright:

**Step 1: Track New 52-Week Highs**
```bash
npx playwright test test/52WeekStocksTrack.spec.ts
```

**Step 2: Update Prices**
```bash
npx playwright test test/updateCurrentPrice.spec.ts
```

**Step 3: Sort File**
```bash
npx playwright test test/sortMyTrack.spec.ts
```

## 📝 CSV/Excel Format

### Input Files

**52WeekHigh.csv** (daily input):
```csv
Symbol,Series,LTP,%chng,New 52W/H price,Prev.High,Prev. High Date
ABCAPITAL,EQ,355.85,-0.61,360.15,360.15,28-Nov-2025
```

**today_price.csv** (daily input):
```csv
GAIN_LOSS,SECURITY,CLOSE_PRIC,PREV_CL_PR,PERCENT_CG
G,ADANIPORTS,1549,1540,0.58
```

### Output File

**My_Track.xlsx** (master tracking file):
```csv
Symbol,Series,date,New52WHprice,CurrentPrice,PcntChange,WatchList,Score,MyResearch Date
ADANIPORTS,EQ,12/1/2025,1549,1549,0.00,Yes,10,12/01/2025
RELIANCE,EQ,11/28/2025,2450.00,2460.00,0.41,No,5,
```

## 📄 License

MIT License

## 👤 Author

**Sangamnath Ingalalli**
- GitHub: [@SangamnathIngalalli](https://github.com/SangamnathIngalalli)

---

*Built with Playwright for automated stock tracking and swing trading analysis*
