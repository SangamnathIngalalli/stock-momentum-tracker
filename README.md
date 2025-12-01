# Stock Momentum Tracker

A comprehensive automation tool designed to assist swing traders by tracking stocks that hit their 52-week highs and monitoring their daily price movements. This project uses Playwright for automation and maintains a local CSV database (`My_Track.csv`) of tracked stocks with full preservation of manually added columns.

## 🚀 Features

* **52-Week High Tracking**: Automatically reads daily reports of stocks hitting 52-week highs and adds new entries to the master tracking list (`My_Track.csv`).
* **Price Monitoring**: Updates the current price from `today_price.csv` and calculates percentage changes for all tracked stocks.
* **Column Preservation**: Safeguards all manually added columns (MyResearch Date, fundamentalScore, status, Reason, Allocation Justification) during updates.
* **Sequential Pipeline**: A robust test runner that executes the tracking and updating processes in the correct order.
* **Duplicate Prevention**: Ensures stocks are not added multiple times to the master list.
* **Data Persistence**: Maintains a history of when stocks were added and their initial breakout price.

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

The scripts use hardcoded paths for input and output CSV files, tailored for a specific local environment (OneDrive).

**Important**: Before running, update the file paths in the following files to match your local setup:

* `test/52WeekStocksTrack.spec.ts`:
  * `SRC_FILE`: Path to the daily `52WeekHigh.csv` report
  * `DEST_FILE`: Path to your master `My_Track.csv`
* `test/updateCurrentPrice.spec.ts`:
  * `MY_TRACK_CSV`: Path to your master `My_Track.csv`
  * `TODAY_CSV`: Path to the daily `today_price.csv`

## ▶️ Usage

### Run the Full Pipeline (Recommended)

Use the `SequentialTestRunner` to execute the entire workflow in the correct order:

```bash
npx ts-node test/SequentialTestRunner.ts
```

This will:
1. **Track 52-Week Highs**: Add new stocks from the daily `52WeekHigh.csv` with the current date
2. **Update Current Prices**: Update the latest prices from `today_price.csv` for all stocks in your list
3. **Generate Summary**: Display a detailed report of the execution

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

**Step 3: Verify Column Preservation**
```bash
npx playwright test test/verifyColumns.spec.ts
```

## 📂 Project Structure

```
stock-momentum-tracker/
├── test/
│   ├── 52WeekStocksTrack.spec.ts    # Script to add new 52-week high stocks
│   ├── updateCurrentPrice.spec.ts   # Script to update current prices
│   ├── verifyColumns.spec.ts        # Script to verify column preservation
│   ├── SequentialTestRunner.ts      # Orchestrator for running tests in order
│   └── Flow.spec.ts                 # Legacy flow test
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 CSV Format

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

**My_Track.csv** (master tracking file):
```csv
Symbol,Series,date,New52WHprice,CurrentPrice,PcntChange,MyResearch Date,fundamentalScore,status,Reason,Allocation Justification
ADANIPORTS,EQ,12/1/2025,1549,1549,0.00,,,,,
RELIANCE,EQ,11/28/2025,2450.00,2460.00,0.41,2025-12-01,85,Active,Strong fundamentals,High
```

**Column Descriptions**:
* `Symbol`: Stock symbol
* `Series`: Series type (EQ, BE, SM, etc.)
* `date`: Date when the stock was added to tracker (Entry Date)
* `New52WHprice`: Price at which it hit the 52-week high
* `CurrentPrice`: Latest price from `today_price.csv`
* `PcntChange`: Percentage change = ((CurrentPrice - New52WHprice) / New52WHprice) × 100
* `MyResearch Date`: Manually added - your research date
* `fundamentalScore`: Manually added - fundamental analysis score
* `status`: Manually added - stock status
* `Reason`: Manually added - reason for tracking
* `Allocation Justification`: Manually added - allocation notes

## 🔒 Column Preservation

All manually added columns are **100% preserved** during updates:
* MyResearch Date
* fundamentalScore
* status
* Reason
* Allocation Justification

The scripts only update specific columns (Symbol, Series, date, New52WHprice, CurrentPrice, PcntChange) and preserve all other data.

## 📊 Workflow

```
Daily Workflow:
1. Download 52WeekHigh.csv ────┐
2. Download today_price.csv ───┤
                               ├──> Run: npx ts-node test/SequentialTestRunner.ts
                               │
                               └──> My_Track.csv updated with:
                                    • New stocks added
                                    • Prices updated
                                    • % changes calculated
                                    • Manual columns preserved
```

## 🧪 Testing

Verify that column preservation is working:
```bash
npx playwright test test/verifyColumns.spec.ts
```

This test confirms all 11 columns are present and intact in `My_Track.csv`.

## 📄 License

MIT License

## 👤 Author

**Sangamnath Ingalalli**
- GitHub: [@SangamnathIngalalli](https://github.com/SangamnathIngalalli)

---

*Built with Playwright for automated stock tracking and swing trading analysis*
