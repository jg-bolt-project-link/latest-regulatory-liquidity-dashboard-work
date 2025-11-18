# FR 2052a LCR/NSFR Calculation System - User Guide

## Quick Start

### Step 1: Load Sample Data

1. Navigate to the **Executive Dashboard**
2. Click the **"Seed Sample Data"** button
3. Wait for the data generation to complete (typically 30-60 seconds)
4. You'll see a confirmation showing:
   - Number of FR 2052a line items created (~6,000-8,000 records)
   - Number of entities processed
   - Number of reporting periods (6 periods)
   - Number of LCR calculations completed
   - Number of NSFR calculations completed

### Step 2: View LCR/NSFR Results

Navigate to **Liquidity Metrics** from the sidebar to view:

#### LCR Tab
- **LCR Ratio**: Current ratio vs. 100% regulatory minimum
- **Total HQLA**: High-Quality Liquid Assets breakdown
  - Level 1 Assets (0% haircut)
  - Level 2A Assets (15% haircut)
  - Level 2B Assets (50% haircut)
- **Cash Flows**: 30-day horizon
  - Total cash outflows by category
  - Total cash inflows (capped at 75% of outflows)
  - Net cash outflows
- **Compliance Status**: Green if ≥100%, Red if <100%

#### NSFR Tab
- **NSFR Ratio**: Current ratio vs. 100% regulatory minimum
- **Available Stable Funding (ASF)**: Sources
  - Capital contributions
  - Retail deposits (stable vs. less stable)
  - Wholesale funding by maturity
  - Other liabilities
- **Required Stable Funding (RSF)**: Uses
  - Level 1 HQLA (0% RSF)
  - Level 2A HQLA (15% RSF)
  - Level 2B HQLA (50% RSF)
  - Loans by type (65-85% RSF)
  - Other assets (85-100% RSF)
- **Compliance Status**: Green if ≥100%, Red if <100%

### Step 3: Explore FR 2052a Details

Navigate to **FR 2052a Dashboard** to view:

- **Line-by-line detail** of all FR 2052a records
- **Product category summaries**
- **Maturity profile analysis**
- **Counterparty breakdowns**
- **HQLA composition**
- **Asset class distribution**

## What the System Does

### Data Generation

The system generates **comprehensive FR 2052a reporting data** including:

#### 10 Product Categories
1. Deposits (retail, wholesale, financial institution)
2. Loans (mortgage, consumer, commercial, revolving)
3. Securities (treasury, agency, municipal, corporate, equity)
4. Derivatives (swaps, forwards, options, CDS)
5. Secured funding (repos, reverse repos, securities lending)
6. Credit facilities (committed/uncommitted lines)
7. Liquidity facilities (conduits, ABCP)
8. Capital (equity, preferred, retained earnings)
9. Other assets (cash, reserves, fixed assets)
10. Other liabilities (payables, accruals)

#### Multiple Sub-Products per Category
Example for Deposits:
- Stable retail deposits
- Less stable retail deposits
- Operational wholesale deposits
- Non-operational wholesale deposits

#### 8 Maturity Buckets
- Overnight
- 2-7 days
- 8-30 days
- 31-90 days
- 91-180 days
- 181-365 days
- Greater than 1 year
- Open maturity

#### Multiple Counterparty Types
- Retail customers
- Corporate clients
- Small/medium enterprises (SME)
- Financial institutions
- Central banks
- Government entities
- And more...

#### Multiple Asset Classes
- Government securities
- Corporate bonds
- Residential mortgages
- Commercial real estate
- Equity securities
- And more...

**Total Combinations**: Over 1,000 unique line items per reporting period!

### LCR Calculation

**Purpose**: Ensures banks have sufficient high-quality liquid assets to survive a 30-day stressed funding scenario.

**Methodology**:
1. **Identify HQLA**: Cash, central bank reserves, government securities, high-quality bonds
2. **Apply Haircuts**: Level 1 (0%), Level 2A (15%), Level 2B (50%)
3. **Calculate Outflows**: Expected cash outflows over 30 days
   - Deposit runoffs (retail 3-10%, wholesale 25-100%)
   - Maturing secured funding
   - Derivatives payments
   - Contingent outflows
4. **Calculate Inflows**: Expected cash inflows (capped at 75% of outflows)
5. **Compute Ratio**: HQLA / Net Cash Outflows

**Regulatory Minimum**: 100%

### NSFR Calculation

**Purpose**: Ensures banks maintain stable funding profile relative to composition of assets and off-balance sheet activities.

**Methodology**:
1. **Calculate ASF** (Available Stable Funding):
   - Capital: 100% ASF factor
   - Stable retail deposits (>6 months): 95% ASF
   - Less stable retail deposits (>6 months): 90% ASF
   - Wholesale operational deposits (>6 months): 50% ASF
   - Other wholesale funding by maturity: 0-100% ASF

2. **Calculate RSF** (Required Stable Funding):
   - Cash and Level 1 HQLA: 0% RSF
   - Level 2A HQLA: 15% RSF
   - Level 2B HQLA: 50% RSF
   - Residential mortgages (>1 year): 65% RSF
   - Other performing loans: 85% RSF
   - All other assets: 100% RSF

3. **Compute Ratio**: ASF / RSF

**Regulatory Minimum**: 100%

## Understanding the Results

### Sample Output

After running the data generation, you might see results like:

```
LCR Ratio: 85.5%
├─ Total HQLA: $128.3B
│  ├─ Level 1: $85.2B
│  ├─ Level 2A: $32.4B
│  └─ Level 2B: $10.7B
├─ Total Cash Outflows: $185.6B
│  ├─ Retail Deposits: $12.5B
│  ├─ Wholesale Funding: $98.3B
│  ├─ Secured Funding: $45.2B
│  ├─ Derivatives: $18.7B
│  └─ Other: $10.9B
├─ Total Cash Inflows: $35.4B (capped)
└─ Net Cash Outflows: $150.2B

NSFR Ratio: 92.3%
├─ Available Stable Funding: $461.5B
│  ├─ Capital: $85.0B
│  ├─ Retail Deposits: $245.3B
│  ├─ Wholesale Funding: $98.2B
│  └─ Other Liabilities: $33.0B
└─ Required Stable Funding: $500.1B
   ├─ Level 1 Assets: $0B
   ├─ Level 2A Assets: $4.9B
   ├─ Loans: $385.7B
   └─ Other Assets: $109.5B
```

### Interpreting Results

**If LCR < 100%**:
- Bank needs more HQLA or less cash outflows
- Options: Increase treasury holdings, reduce short-term wholesale funding, extend deposit maturities

**If NSFR < 100%**:
- Bank needs more stable funding or fewer long-term assets
- Options: Increase capital/long-term deposits, reduce long-term loans, increase HQLA holdings

**Test Data Note**: The generated test data uses $1M per line item across all combinations. This creates a realistic portfolio structure but ratios may not meet regulatory minimums. In production, banks actively manage their balance sheets to maintain compliance.

## Interactive Features

### Period-over-Period Analysis
- Select different reporting periods from dropdown
- Compare current vs. prior period ratios
- Analyze trends over 6 months
- Identify drivers of change

### Drill-Down Capabilities
Each metric has interactive icons:
- 👁️ **Eye (Blue)**: View data quality, feeds, lineage
- 📄 **Text (Purple)**: See regulatory references
- 📊 **Table (Green)**: Access raw FR 2052a data
- 📈 **Trending (Orange)**: Analyze change drivers

### Export to PowerPoint
- One-click export of liquidity metrics
- Professional 1-page summary
- Current vs. prior period comparison
- Visual compliance indicators

## Data Specification

### Each Record Contains

- **Product Details**: Category, sub-product, asset class
- **Counterparty Info**: Type, internal rating
- **Maturity Details**: Bucket, projected cash flows
- **HQLA Classification**: Level (1/2/3), haircut rate
- **LCR Factors**: Runoff rates, inflow/outflow projections
- **NSFR Factors**: ASF and RSF percentages
- **Amounts**: Outstanding balance, encumbered portion
- **Currency**: USD (multi-currency supported)
- **Entity**: Legal entity association
- **Date**: Reporting period

### Scale

- **Per Entity**: ~1,000-1,200 line items
- **Per Period**: 6 historical periods
- **Total Records**: 6,000-7,200+ per entity
- **All set to $1,000,000** for consistent testing

## Regulatory Context

### FR 2052a Report
- Required for US bank holding companies with ≥$50B assets
- Submitted monthly to Federal Reserve
- Captures detailed liquidity positions and funding sources
- Supports supervisory liquidity monitoring

### Basel III LCR
- International standard from Basel Committee
- Implemented in US via 12 CFR Part 249 (2014)
- 100% requirement phased in by January 2017
- Applies to internationally active banks

### Basel III NSFR
- International standard from Basel Committee
- Implemented in US via 12 CFR Part 329 (2021)
- 100% requirement effective July 2021
- Applies to banks with ≥$100B assets

## Troubleshooting

**Q: Data generation is taking a long time**
A: Generating 6,000+ records with calculations takes 30-60 seconds. Be patient!

**Q: I don't see any LCR/NSFR metrics**
A: Make sure you've clicked "Seed Sample Data" first to generate the FR 2052a data.

**Q: Ratios are below 100%**
A: This is expected with test data. Real banks actively manage their portfolios to maintain compliance.

**Q: Can I customize the product mix?**
A: Yes, modify `generateFR2052aData.ts` to adjust products, amounts, or ratios.

**Q: How do I add more reporting periods?**
A: Edit the `reportDates` array in `seedFR2052aWithCalculations.ts`.

## Advanced Usage

### Modifying Base Amounts

Edit `generateFR2052aData.ts`:
```typescript
const baseAmount = 1000000; // Change to desired amount
```

### Adding Custom Products

Add to the `products` array in `generateFR2052aData.ts`:
```typescript
{
  category: 'your_category',
  counterpartyTypes: ['type1', 'type2'],
  subProducts: ['sub1', 'sub2'],
  maturities: ['overnight', '8-30days'],
  isHQLA: false
}
```

### Adjusting Calculation Rules

Modify factors in `fr2052aCalculations.ts`:
- `getRetailDepositRunoffRate()`: Deposit runoff assumptions
- `getWholesaleRunoffRate()`: Wholesale funding assumptions
- `getRSFFactor()`: NSFR required stable funding factors
- `getASFFactor()`: NSFR available stable funding factors

## System Files

- `src/utils/fr2052aCalculations.ts` - LCR/NSFR calculation engine
- `src/utils/generateFR2052aData.ts` - Comprehensive data generator
- `src/utils/seedFR2052aWithCalculations.ts` - Seeding pipeline
- `FR2052A_CALCULATION_SYSTEM.md` - Technical documentation
- `FR2052A_USER_GUIDE.md` - This file

## Support

For technical details, see `FR2052A_CALCULATION_SYSTEM.md`

For questions about Basel III requirements, refer to:
- [Basel III LCR Standard](https://www.bis.org/publ/bcbs238.pdf)
- [Basel III NSFR Standard](https://www.bis.org/bcbs/publ/d295.pdf)
- [Federal Reserve LCR Rule](https://www.federalreserve.gov/newsevents/pressreleases/bcreg20140903a.htm)
- [Federal Reserve NSFR Rule](https://www.federalreserve.gov/newsevents/pressreleases/bcreg20201020a.htm)
