# How to Access Detailed LCR/NSFR Component Breakdowns

## Current Status

The enhanced LCR validation screen with detailed component breakdowns has been fully implemented. However, **the component data tables are currently empty** because they were added after the initial data generation.

## What You Need to Do

### Step 1: Regenerate Data with Enhanced Calculations

1. **Navigate to Data Setup**
   - Click the "Data Setup" menu item in the left navigation

2. **Generate Sample Data**
   - Click the "Generate Sample Data" button
   - Wait for the workflow to complete (~30-45 seconds)
   - The system will now:
     - Seed LCR calculation rules (FR2052a Appendix VI)
     - Generate FR2052a line items
     - Calculate LCR/NSFR metrics
     - **NEW**: Store detailed component breakdowns in the database

### Step 2: Access the Enhanced LCR Validation Screen

1. **Navigate to FR2052a Validation**
   - Click "FR2052a Validation" in the left navigation menu

2. **Switch to LCR Tab**
   - At the top of the page, you'll see tabs: Overview | Rules | Submissions | Errors | **LCR** | NSFR | Executions
   - Click the **"LCR"** tab

3. **Select a Submission**
   - Use the dropdown menu in the top right to select a submission
   - Example: "SSIF - 10/31/2024" or "BHC - 12/31/2024"

4. **View Detailed Breakdown**
   - The enhanced screen will now display with complete component breakdowns

## What You'll See

### HQLA Section (Collapsible)
Each HQLA level shows:
- **Total Amount** (before liquidity value factors)
- **Haircut Rate** (e.g., 15%)
- **Liquidity Value Factor** (e.g., 85%) ← CORRECT TERMINOLOGY
- **Liquidity Value** (final amount used in LCR)
- **Record Count** (number of FR2052a line items)
- **[View Rule]** button → Opens FR2052a Appendix VI rule details

Example:
```
Level 2A Assets - GSE Securities
  Total Amount:           $32,470,588
  Haircut Rate:           15%
  Amount After Haircut:   $27,600,000
  Liquidity Value Factor: 85%
  Liquidity Value:        $23,460,000

  127 FR2052a records • [View Rule]
```

### Cash Outflows Section (Collapsible)
Broken down by category:

**Retail Deposit Outflows**
- Stable Retail Deposits: Total $20M × 3% runoff = $600,000
- Less Stable Deposits: Total $6M × 10% runoff = $600,000

**Wholesale Funding Outflows**
- Operational Deposits: Total $10M × 25% runoff = $2,500,000
- Non-Operational Deposits: Total $10M × 40% runoff = $4,000,000
- Financial Institutions: Total $2M × 100% runoff = $2,000,000

**Other Categories**
- Secured Funding Outflows
- Derivatives Outflows
- Contingent Outflows

Each line shows:
- Product type
- Total amount before runoff
- Runoff rate
- Calculated outflow
- Record count
- [View Rule] button

### Cash Inflows Section (Collapsible)
Broken down by product:

**Maturing Loans**
- Consumer Loans: Total $6M × 50% inflow = $3,000,000
- Commercial Loans: Total $4M × 50% inflow = $2,000,000

**Maturing Securities**
- Corporate Bonds: Total $3M × 50% inflow = $1,500,000

**Reverse Repos with Central Banks**
- Fed Reverse Repos: Total $2M × 100% inflow = $2,000,000

Plus an Inflow Cap notice showing:
- Total Inflows (Uncapped)
- Maximum Allowed (75% of Outflows)
- Capped Inflows (Used in LCR)

### Rule Details Modal
Click any **[View Rule]** button to see:
- Rule Code (e.g., HQLA_L2A_GSE)
- FR2052a Appendix VI Section Reference
- Regulatory Citation (12 CFR 249)
- Calculation Formula
- Factor Applied (e.g., 85%)
- Description and Examples

## Navigation Summary

```
Main Menu
  └─ FR2052a Validation
       └─ Click "LCR" tab
            └─ Select submission from dropdown
                 └─ View enhanced validation screen with:
                      ├─ HQLA Components (Total Amount vs Liquidity Value)
                      ├─ Outflow Components (by category and product)
                      ├─ Inflow Components (by product)
                      └─ Rule References (FR2052a Appendix VI)
```

## NSFR Navigation

The same pattern applies for NSFR:
1. Go to FR2052a Validation
2. Click **"NSFR"** tab
3. Select a submission
4. View NSFR component breakdown (ASF and RSF details)

## Why This Matters

This enhanced system provides:

1. **Transparency**: See every calculation step from source data to final LCR
2. **Regulatory Compliance**: Direct mapping to FR2052a Appendix VI and 12 CFR 249
3. **Data Quality**: Verify components sum to totals
4. **Auditability**: Trace from LCR ratio → components → source records
5. **Correct Terminology**: Liquidity value factors (not "haircuts")
6. **User Education**: Learn how LCR/NSFR calculations work through rule references

## Troubleshooting

**Q: I don't see any component details**
A: The component tables are empty. Follow Step 1 to regenerate data.

**Q: The dropdown shows no submissions**
A: Generate sample data first (Step 1).

**Q: I only see the summary, not detailed components**
A: Ensure you've regenerated data after the latest code deployment.

**Q: The "View Rule" buttons don't work**
A: The calculation rules need to be seeded. This happens automatically during data generation.

**Q: Components don't sum to the total**
A: This indicates a calculation discrepancy. Check the console for errors and report the issue.

## Technical Details

**Database Tables:**
- `lcr_hqla_components` - HQLA breakdown by level
- `lcr_outflow_components` - Outflow breakdown by category/product
- `lcr_inflow_components` - Inflow breakdown by product
- `lcr_calculation_rules` - FR2052a Appendix VI rules
- `lcr_calculation_validations` - Summary metrics

**Component Fields:**
- `total_amount` - Amount before factors
- `haircut_rate` - Haircut percentage
- `liquidity_value_factor` - Factor applied (e.g., 0.85 for Level 2A)
- `liquidity_value` - Final amount used in calculation
- `runoff_rate` - Outflow rate applied
- `inflow_rate` - Inflow rate applied
- `fr2052a_line_references` - Source record IDs
- `record_count` - Number of source records
- `regulatory_reference` - Link to calculation rule

## Next Steps

After viewing the enhanced LCR details:
1. Verify component totals match summary totals
2. Click "View Rule" buttons to understand calculation methodologies
3. Review record counts to ensure data completeness
4. Compare liquidity values to total amounts to understand haircut impact
5. Check that retail + wholesale + secured + derivatives + contingent = total outflows
6. Verify inflow cap is correctly applied (75% of outflows)
