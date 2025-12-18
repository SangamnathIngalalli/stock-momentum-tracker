# Professional Stock Trackers Guide

This guide explains how to use the "High ROIC Growth Momentum" and "Bull stock with FII Buy" trackers.

## 📋 Overview
These specialist trackers are designed to monitor specific lists of high-quality stocks. They automate the process of updating closing prices, checking for new highs, and calculating daily performance relative to those highs.

## 🚀 How to Run
### Run All 4 Specialists Sequentially (Recommended)
```bash
npx ts-node test/SpecialistRunners.ts
```

### Run Individually
Execute the relevant command in your terminal:

**High ROIC Growth Momentum:**
```bash
npx playwright test test/highRoicGrowthMomentum.spec.ts
```

**Bull stock with FII Buy:**
```bash
npx playwright test test/bullStockFiiBuy.spec.ts
```

**Quality Growth Pullback – Positional:**
```bash
npx playwright test test/qualityGrowthPullback.spec.ts
```

**Quality Growth with Institutional Support:**
```bash
npx playwright test test/qualityGrowthInstSupport.spec.ts
```

## ⚙️ How It Works
1.  **Backup**: Before any modification, the script creates a backup of your Excel file with a timestamp in the **`screener\Backup`** folder.
2.  **Data Sync**: It reads the latest daily prices from `today_price.csv`.
3.  **High Price Tracking**: 
    - It looks at the current **High Price** in Column C.
    - If today's price is higher than the recorded High Price, it updates Column C to the new value.
4.  **Current Price Update**: Updates Column D with the latest close.
5.  **Momentum Calculation**:
    - Calculates `((Current Price - High Price) / High Price) * 100`.
    - Updates Column E (**Pcnt Change**).
6.  **Preservation**: For the ROIC tracker, Columns F, G, and H (`take 1`, `take 2`, `take 3`) and any other manual columns like `score` are preserved exactly as they are.
7.  **Auto-Sorting**: Both sheets are sorted by **Pcnt Change** in ascending order, so the stocks with the most significant pullbacks appear at the top.

## 📂 File Locations
- **Scripts**: 
  - `test/highRoicGrowthMomentum.spec.ts`
  - `test/bullStockFiiBuy.spec.ts`
  - `test/qualityGrowthPullback.spec.ts`
  - `test/qualityGrowthInstSupport.spec.ts`
- **Screener Files**: `C:\Users\Administrator\OneDrive\Swing Trading\screener\`
- **Backup Folder**: `C:\Users\Administrator\OneDrive\Swing Trading\screener\Backup\`
- **Daily Prices**: `C:\Users\Administrator\OneDrive\check Swing trading\today_price.csv`

## 🛡️ Safety
- The script uses the `stock_mappings.ts` file to handle symbol differences (e.g., if the NSE symbol differs from your tracker symbol).
- It also respects the `IGNORED_SYMBOLS` list to skip ETFs or indices.
