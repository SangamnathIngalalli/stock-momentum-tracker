# Playwright Stock Market Swing Trading Tracker

A comprehensive automation tool designed to assist swing traders by tracking stocks that hit their 52-week highs and monitoring their daily price movements. This project uses Playwright for automation and maintains a local CSV database of tracked stocks.

## 🚀 Features

*   **52-Week High Tracking**: Automatically reads daily reports of stocks hitting 52-week highs and adds new entries to a master tracking list (`stocks.csv`).
*   **Price Monitoring**: Updates the current price and calculates percentage changes for all tracked stocks using the latest daily data.
*   **Sequential Pipeline**: A robust test runner that executes the tracking and updating processes in the correct order.
*   **Duplicate Prevention**: Ensures stocks are not added multiple times to the master list.
*   **Data Persistence**: Maintains a history of when stocks were added and their initial breakout price.

## 🛠️ Prerequisites

*   Node.js (v14 or higher)
*   npm (Node Package Manager)

## 📦 Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd playwright-stock-market-swing
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

## ⚙️ Configuration

The scripts currently use hardcoded paths for input and output CSV files, tailored for a specific local environment (OneDrive).

**Important**: Before running, please update the file paths in the following files to match your local setup:

*   `test/52WeekStocksTrack.spec.ts`:
    *   `SRC_FILE`: Path to the daily 52-week high CSV report.
    *   `DEST_DIR`: Directory where the master `stocks.csv` will be stored.
*   `test/updateCurrentPrice.spec.ts`:
    *   `STOCKS_CSV`: Path to your master `stocks.csv`.
    *   `TODAY_CSV`: Path to the daily price update CSV.

## ▶️ Usage

### Run the Full Pipeline (Recommended)

Use the `SequentialTestRunner` to execute the entire workflow in the correct order:

```bash
npx ts-node test/SequentialTestRunner.ts
```

This will:
1.  **Track 52-Week Highs**: Add new stocks from the daily report.
2.  **Update Current Prices**: Update the latest prices for all stocks in your list.
3.  **Generate Summary**: Display a detailed report of the execution.

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

## 📂 Project Structure

```
playwright-stock-market-swing/
├── test/
│   ├── 52WeekStocksTrack.spec.ts   # Script to add new 52-week high stocks
│   ├── updateCurrentPrice.spec.ts  # Script to update current prices
│   └── SequentialTestRunner.ts     # Orchestrator for running tests in order
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 CSV Format

The master `stocks.csv` file uses the following format:

```csv
Symbol,Series,date,New52WHprice,CurrentPrice,PcntChange
RELIANCE,EQ,2023-10-27,2450.00,2460.00,0.41
...
```

*   `date`: The date the stock was added to the tracker (Entry Date).
*   `New52WHprice`: The price at which it hit the 52-week high.
