# FR 2052a Calculation System

## Overview

This system implements comprehensive **Liquidity Coverage Ratio (LCR)** and **Net Stable Funding Ratio (NSFR)** calculations based on Federal Reserve Board FR 2052a reporting requirements and Basel III liquidity standards.

## System Architecture

### 1. Data Generation (`generateFR2052aData.ts`)

Generates comprehensive FR 2052a line items across all regulatory dimensions:

#### Product Categories (10)
1. **Deposits** - Retail, wholesale, and financial institution deposits
2. **Loans** - Mortgages, consumer, commercial, and revolving credit
3. **Securities** - Treasuries, agencies, municipals, corporate bonds, equity
4. **Derivatives** - Interest rate swaps, FX forwards, CDS, equity options
5. **Secured Funding** - Repos, reverse repos, securities lending
6. **Credit Facilities** - Committed/uncommitted lines, standby letters of credit
7. **Liquidity Facilities** - Conduits, asset-backed commercial paper
8. **Capital** - Common equity, preferred stock, retained earnings
9. **Other Assets** - Cash, central bank reserves, fixed assets, intangibles
10. **Other Liabilities** - Accounts payable, accrued expenses, deferred revenue

#### Sub-Products
- **Deposits**: stable, less_stable, operational, non_operational
- **Loans**: mortgage, consumer, commercial, revolving
- **Securities**: treasury, agency, municipal, corporate_bond, equity
- **Derivatives**: interest_rate_swap, fx_forward, credit_default_swap, equity_option
- **Secured Funding**: repo, reverse_repo, securities_lending, collateral_swap

#### Maturity Buckets (8)
- overnight
- 2-7 days
- 8-30 days
- 31-90 days
- 91-180 days
- 181-365 days
- greater than 1 year
- open maturity

#### Counterparty Types
- retail
- corporate
- wholesale
- financial_institution
- government
- sovereign
- sme (small/medium enterprise)
- hedge_fund
- central_bank
- special_purpose_vehicle
- shareholder
- trade_creditor

#### Asset Classes
- government
- corporate
- covered_bond
- equity
- residential
- commercial
- unsecured
- interest_rate
- fx (foreign exchange)
- credit
- cash
- property
- intangible

### 2. Calculation Engine (`fr2052aCalculations.ts`)

Implements Basel III LCR and NSFR calculation methodologies.

#### LCR Calculation

**Formula**: `LCR = HQLA / Net Cash Outflows`

**Minimum Requirement**: 100% (1.0)

**High-Quality Liquid Assets (HQLA)**

1. **Level 1 Assets (0% haircut)**
   - Cash
   - Central bank reserves
   - US Treasury securities
   - Certain sovereign debt

2. **Level 2A Assets (15% haircut)**
   - Government-sponsored enterprise (GSE) securities
   - High-quality sovereign and municipal bonds
   - High-quality covered bonds

3. **Level 2B Assets (50% haircut)**
   - Lower-quality corporate bonds (BBB- or better)
   - Residential mortgage-backed securities
   - Certain equities

**HQLA Caps**:
- Level 2A assets capped at 40% of total HQLA (after haircuts)
- Level 2B assets capped at 15% of total HQLA (after haircuts)

**Cash Outflows (30-day horizon)**

1. **Retail Deposit Runoff Rates**
   - Stable deposits: 3%
   - Less stable deposits: 10%

2. **Wholesale Funding Runoff Rates**
   - Operational deposits: 25%
   - Non-operational deposits: 40%
   - Financial institution deposits: 100%

3. **Secured Funding Outflows**
   - Backed by Level 1 assets: 0%
   - All others: 100%

4. **Derivatives Outflows**
   - Full projected outflow amount

5. **Other Contractual Outflows**
   - Maturing obligations within 30 days: 100%

6. **Contingent Outflows**
   - Credit/liquidity facilities: 5% of committed amount

**Cash Inflows (30-day horizon)**

- Maturing loans (retail/corporate): 50% cap
- Other contractual inflows: 100%
- **Inflow Cap**: Maximum 75% of total outflows

**Net Cash Outflows**

```
Net Cash Outflows = MAX(Total Outflows - MIN(Total Inflows, 75% × Total Outflows), 25% × Total Outflows)
```

#### NSFR Calculation

**Formula**: `NSFR = Available Stable Funding / Required Stable Funding`

**Minimum Requirement**: 100% (1.0)

**Available Stable Funding (ASF) Factors**

| Funding Source | Maturity | ASF Factor |
|---------------|----------|------------|
| Capital (Tier 1 & 2) | Any | 100% |
| Retail deposits - stable | ≥ 6 months | 95% |
| Retail deposits - less stable | ≥ 6 months | 90% |
| Wholesale operational deposits | ≥ 6 months | 50% |
| Wholesale non-operational | < 6 months | 0% |
| Wholesale non-operational | 6-12 months | 50% |
| Wholesale non-operational | ≥ 12 months | 100% |

**Required Stable Funding (RSF) Factors**

| Asset Type | RSF Factor |
|-----------|------------|
| Cash | 0% |
| Central bank reserves | 0% |
| Level 1 HQLA | 0% |
| Level 2A HQLA | 15% |
| Level 2B HQLA | 50% |
| Residential mortgages (≥ 1 year) | 65% |
| Other loans | 85% |
| Corporate bonds | 85% |
| Equities | 85% |
| Fixed assets | 100% |
| All other assets | 100% |

### 3. Data Seeding (`seedFR2052aWithCalculations.ts`)

Automated pipeline that:

1. **Generates FR 2052a Data**
   - Creates line items for all product/counterparty/maturity combinations
   - Each record: $1,000,000 base amount
   - Calculates projected inflows/outflows
   - Assigns HQLA levels and factors

2. **Runs Calculations**
   - Executes LCR calculation engine
   - Executes NSFR calculation engine
   - Validates results against regulatory thresholds

3. **Stores Results**
   - Saves FR 2052a line items to `fr2052a_data_rows`
   - Saves LCR metrics to `lcr_metrics`
   - Saves NSFR metrics to `nsfr_metrics`
   - Links all data to user and legal entity

4. **Multi-Period Support**
   - Generates data for 6 reporting periods
   - Enables period-over-period analysis
   - Supports trend analysis

## Database Schema

### fr2052a_data_rows

Stores detailed FR 2052a line items:

```sql
- id (uuid)
- user_id (uuid) - RLS enforced
- legal_entity_id (uuid)
- report_date (date)
- product (text) - Product category
- sub_product (text) - Detailed product type
- sub_product2 (text) - Asset class
- counterparty (text)
- maturity_bucket (text)
- currency (text)
- amount (numeric) - Outstanding balance
- is_hqla (boolean)
- hqla_level (integer) - 1, 2, or 3
- haircut_rate (numeric)
- runoff_rate (numeric) - For deposits/funding
- rsf_factor (numeric) - Required stable funding factor
- asf_factor (numeric) - Available stable funding factor
- projected_inflow (numeric)
- projected_outflow (numeric)
- encumbered_amount (numeric)
- internal_rating (text)
```

### lcr_metrics

Stores calculated LCR results:

```sql
- id (uuid)
- user_id (uuid)
- legal_entity_id (uuid)
- report_date (date)
- lcr_ratio (numeric)
- total_hqla (numeric)
- level1_assets (numeric)
- level2a_assets (numeric)
- level2b_assets (numeric)
- total_cash_outflows (numeric)
- total_cash_inflows (numeric)
- total_net_cash_outflows (numeric)
- hqla_excess_shortfall (numeric)
- is_compliant (boolean)
- retail_deposit_outflows (numeric)
- wholesale_funding_outflows (numeric)
- secured_funding_outflows (numeric)
- derivatives_outflows (numeric)
- other_contractual_outflows (numeric)
- other_contingent_outflows (numeric)
- capped_inflows (numeric)
```

### nsfr_metrics

Stores calculated NSFR results:

```sql
- id (uuid)
- user_id (uuid)
- legal_entity_id (uuid)
- report_date (date)
- nsfr_ratio (numeric)
- available_stable_funding (numeric)
- required_stable_funding (numeric)
- asf_capital (numeric)
- asf_retail_deposits (numeric)
- asf_wholesale_funding (numeric)
- asf_other_liabilities (numeric)
- rsf_level1_assets (numeric)
- rsf_level2a_assets (numeric)
- rsf_level2b_assets (numeric)
- rsf_loans (numeric)
- rsf_other_assets (numeric)
- asf_surplus_deficit (numeric)
- is_compliant (boolean)
```

## Usage

### Generating Data

In the Executive Dashboard, click "Seed Sample Data" button:

```typescript
await seedFR2052aWithCalculations(userId);
```

This generates:
- **~1,000+ FR 2052a line items** per entity per period
- **6 reporting periods** (current and 5 historical)
- **LCR and NSFR calculations** for each period
- All data automatically linked to legal entities

### Viewing Results

1. **Liquidity Metrics Tab**
   - LCR ratio, HQLA breakdown, outflow details
   - NSFR ratio, ASF/RSF components
   - Period-over-period comparisons
   - Compliance indicators

2. **FR 2052a Dashboard**
   - Detailed line item view
   - Product category summaries
   - Maturity profile analysis
   - Counterparty breakdowns

3. **Data Quality Dashboard**
   - Validation status
   - Completeness checks
   - Regulatory compliance verification

## Expected Output

With $1M per line item across all combinations:

**Sample LCR Results**:
- Total HQLA: ~$50-100B
- Total Cash Outflows: ~$200-300B
- Net Cash Outflows: ~$150-200B
- **LCR Ratio: 50-70%** (illustrative, may be below 100% threshold)

**Sample NSFR Results**:
- Available Stable Funding: ~$300-400B
- Required Stable Funding: ~$400-500B
- **NSFR Ratio: 75-95%** (illustrative, may be below 100% threshold)

Note: Ratios may be below regulatory minimums in test data. In production, banks adjust balance sheet composition to meet requirements.

## Regulatory References

1. **FR 2052a Reporting**
   - Federal Reserve Board Complex Institution Liquidity Monitoring Report
   - Form effective March 2014

2. **LCR Rule**
   - Basel III: Liquidity Coverage Ratio (2010)
   - US Implementation: 12 CFR Part 249 (2014)
   - Minimum: 100% (Phase-in complete January 2017)

3. **NSFR Rule**
   - Basel III: Net Stable Funding Ratio (2014)
   - US Implementation: 12 CFR Part 329 (2021)
   - Minimum: 100% (Effective July 2021)

## Key Features

✅ **Comprehensive Coverage** - All FR 2052a product categories, maturities, counterparties
✅ **Regulatory Accurate** - Basel III LCR/NSFR calculation methodologies
✅ **Multi-Entity Support** - Separate calculations per legal entity
✅ **Time Series** - 6 periods for trend analysis
✅ **Automated Pipeline** - Generate → Calculate → Store in one operation
✅ **Granular Detail** - Drill down from ratio to line item level
✅ **Compliance Tracking** - Automatic threshold checking
✅ **Data Quality** - Validation rules and lineage tracking

## Technical Notes

- All calculations use numeric precision to avoid rounding errors
- HQLA caps enforced per Basel III requirements
- Runoff rates follow US LCR rule specifications
- ASF/RSF factors align with US NSFR final rule
- Multi-currency support (defaults to USD)
- Legal entity consolidation supported
- Historical data retention for regulatory reporting
