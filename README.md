# Stock Momentum Tracker

A comprehensive automation tool designed to assist swing traders by tracking stocks that hit their 52-week highs and monitoring their daily price movements. This project uses Playwright for automation and maintains a local Excel database (`My_Track.xlsx`) of tracked stocks with full preservation of manually added columns.

## 🚀 Features

* **52-Week High Tracking**: Automatically reads daily reports of stocks hitting 52-week highs and adds new entries to the master tracking list.
* **Strict Uniqueness**: Ensures strict "Unique Symbol" tracking. If a stock is already in your list (regardless of date), it won't be re-added, preventing duplicates.
* **Price Monitoring**: Updates the current price from daily Bhavcopy `today_price.csv` and calculates percentage changes for all tracked stocks.
* **Smart Sorting**: Automatically sorts your tracking sheet by Percentage Change (Ascending) to highlight underperforming stocks first.
* **Dynamic Column Preservation**: Safeguards **ANY** manually added columns (e.g., WatchList, Score, Notes, etc.) during updates. You can add as many custom columns as you like.
* **Robust Excel Handling**: Direct reading/writing of `.xlsx` files ensures formatting and data integrity are maintained.
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
**Function:** The Main Orchestrator (The "One-Click" Solution).
*   **Why it is used:** To execute the entire workflow in the correct sequence with a single command, ensuring data integrity.
*   **Workflow Stages:**
    1.  **Fix Header**: Checks `My_Track.xlsx` to ensure headers are clean and readable.
    2.  **Track 52-Week Highs**: Adds new stocks from the daily report.
    3.  **Update Prices**: Refreshes current prices for all tracked stocks.
    4.  **Sort Results**: Sorts the final list by Percentage Change (Low -> High).
*   **Features:** Provides a clean summary in the terminal and waits between stages to prevent file access conflicts.

### 2. `test/52WeekStocksTrack.spec.ts`
**Function:** Tracks new 52-week high stocks.
*   **Why it is used:** To populate `My_Track.xlsx` with fresh stock ideas.
*   **Key Logic:**
    *   **Strict Uniqueness**: It checks if a symbol *already exists* in your file. If found, it skips adding it again, ensuring you have one unique entry per stock.
    *   **Input**: Reads `52WeekHigh.csv`.
    *   **Output**: Appends new rows to `My_Track.xlsx`.
    *   **Preservation**: Reads all existing data first to ensure no manual columns are lost during the append process.

### 3. `test/updateCurrentPrice.spec.ts`
**Function:** Updates current market prices.
*   **Why it is used:** To monitor performance (momentum) of your tracked stocks.
*   **Key Logic:**
    *   **Price Matching**: Reads the daily Bhavcopy (`today_price.csv`) and finds the matching closing price for each of your stocks.
    *   **Percentage Calculation**: Calculates existing % change: `((CurrentPrice - New52WHprice) / New52WHprice) * 100`.
    *   **Fuzzy Matching**: Uses `stock_mappings.ts` to handle complex name variations (e.g. 'M&M' vs 'MAHINDRA & MAHINDRA') if a direct match fails.
    *   **Reporting**: Logs detailed success/failure stats, including which symbols were not found.

### 4. `test/stock_mappings.ts`
**Function:** The "Dictionary" for stock names.
*   **Why it is used:** Stock data sources (NSE, Broker reports) often use different naming conventions.
*   **Features:**
    *   `STOCK_MAPPINGS`: A constant object mapping your tracking symbol to the official Bhavcopy name.
    *   `IGNORED_SYMBOLS`: A list of symbols (like ETFs or Indices) that the system will deliberately ignore and never add to your tracker.

### 5. `test/sortMyTrack.spec.ts`
**Function:** Sorts the master tracking file.
*   **Why it is used:** To help you quickly identify underperforming stocks or stocks near their breakout point.
*   **Logic:**
    *   Sorts by `PcntChange` column in **Ascending** order.
    *   Stocks with negative or low percentage change appear at the top.
    *   Stocks with high positive change appear at the bottom.
    *   Ensures that sorting the logic applies to the *entire row*, keeping your manual notes aligned with the correct stock.

### 6. `test/fixMyTrackHeader.spec.ts`
**Function:** Data Integrity Safeguard.
*   **Why it is used:** Sometimes manual editing in Excel can leave corruption or empty columns in the header row.
*   **Logic:** Scans the header row of `My_Track.xlsx` and removes empty or invalid cells to prevent crashes in subsequent steps.

## ▶️ Usage

### Run the Full Pipeline (Recommended)

Use the `SequentialTestRunner` to execute the entire workflow:

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
ADANIPORTS,EQ,12/1/2025,1549,1549,0.00,Yes,10,2025-12-01
RELIANCE,EQ,11/28/2025,2450.00,2460.00,0.41,No,5,
```

## 📄 License

MIT License

## 👤 Author

**Sangamnath Ingalalli**
- GitHub: [@SangamnathIngalalli](https://github.com/SangamnathIngalalli)

---

*Built with Playwright for automated stock tracking and swing trading analysis*
