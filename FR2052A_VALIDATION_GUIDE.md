# FR 2052a Validation System - User Guide

## Overview

The FR 2052a Validation screen provides comprehensive validation capabilities for FR 2052a regulatory reporting submissions, including:
- Data quality validation
- LCR (Liquidity Coverage Ratio) calculation validation with component drill-down
- NSFR (Net Stable Funding Ratio) summary validation
- Rule execution tracking
- View Rule capability (40 calculation rules)
- View Records capability (link to source data)

---

## Accessing FR 2052a Validation

**Location:** Left Navigation → "FR 2052a Validation"

**Screen Structure:**
- Tab-based interface with 7 tabs
- Each tab provides different validation perspectives
- Submission selector available in each tab

---

## Available Tabs

### **1. Overview Tab**
**Purpose:** High-level summary of all submissions and validation status

**Features:**
- Total submissions count
- Active rules count
- Total errors summary
- Recent submissions list
- Quick execute validation button

**Use Case:**
- Dashboard view of validation health
- Quick access to execute validations
- See which submissions need attention

---

### **2. Validation Rules Tab**
**Purpose:** Browse and manage validation rules

**Features:**
- List of all active validation rules
- Rule categories (Format, Range, Logic, Business)
- Rule descriptions and validation logic
- Enable/disable rules

**Use Case:**
- Understand what rules are being applied
- Configure which rules to execute
- Troubleshoot specific validation failures

---

### **3. Submissions Tab**
**Purpose:** View all FR 2052a submissions

**Features:**
- Complete list of submissions
- Column customization (toggles for each field)
- Status indicators (Valid, Errors, Pending)
- Row counts (total, valid, errors)
- Reporting period and entity information
- Upload timestamps

**Use Case:**
- Browse all submissions
- Filter by status or date
- Select submission for detailed validation
- See which submissions have errors

---

### **4. Error Details Tab**
**Purpose:** View detailed validation errors for a submission

**Features:**
- Submission selector dropdown
- Error summary (total rows, valid rows, error rows, error rate)
- Detailed error list with:
  - Error type and severity (Critical/Warning)
  - Error message
  - Field name and expected/actual values
  - Timestamp

**Use Case:**
- Investigate why submission failed validation
- See specific data quality issues
- Prioritize fixes by severity
- Track error patterns across fields

---

### **5. Rule Executions Tab**
**Purpose:** Track validation rule execution history

**Features:**
- Submission selector
- Execution history for selected submission
- Rule-by-rule execution results:
  - Rule name and category
  - Total rows checked
  - Rows passed vs failed
  - Execution status and time
  - Notes

**Use Case:**
- See which rules passed/failed for a submission
- Performance monitoring (execution time)
- Audit trail of validation runs
- Troubleshoot specific rule failures

---

### **6. LCR Validation Tab** ⭐ **Primary Feature**
**Purpose:** Detailed LCR calculation validation with component drill-down

**Features:**
- **Submission Selector:** Choose which submission to validate
- **Summary Card:**
  - Total HQLA (Level 1, 2A, 2B)
  - Total Cash Outflows
  - Total Cash Inflows
  - Net Cash Outflows
  - LCR Ratio with compliance status

- **Expandable Component Sections:**
  - **High-Quality Liquid Assets (HQLA)**
    - Level 1 Assets (Cash, Treasuries, CB Reserves, Foreign Sovereign)
    - Level 2A Assets (GSE, Foreign Sovereign 20%, PSE)
    - Level 2B Assets (Corporate Debt, Equity, RMBS)

  - **Cash Outflows**
    - Retail (Stable, Less Stable)
    - Wholesale (Operational, Non-Operational, Financial)
    - Secured Funding (Level 1, Level 2A, Other)
    - Derivatives & Commitments

  - **Cash Inflows**
    - Contractual Inflows
    - Inflow Cap

- **Component Details:**
  - Product category and asset class
  - Total amount
  - Haircut/Runoff rate
  - Calculated amount after factor
  - Liquidity value factor
  - Rule code reference

- **View Rule Button:** ✅ **Implemented**
  - Click on any component
  - Opens modal with complete rule details:
    - Rule Code (e.g., `HQLA_L1_SOVEREIGN`)
    - Rule Name
    - FR 2052a Appendix Reference
    - Regulatory Citation (12 CFR 249)
    - Calculation Formula
    - Factor Applied (percentage)
    - Description
    - Examples

- **View Records Button:** ✅ **Implemented**
  - Click on any component
  - Shows FR 2052a source data rows
  - Links calculation to raw data
  - Displays product IDs, amounts, dates

**Use Case:**
- Validate LCR calculations meet 100% minimum requirement
- Drill down into each component to understand composition
- View regulatory rules governing each calculation
- Trace calculations back to source FR 2052a data
- Investigate LCR ratio variances
- Prepare for regulatory examination

**Example Workflow:**
1. Select a submission from dropdown
2. Review LCR ratio in summary card
3. Expand "Level 1 Assets" section
4. Click on "U.S. Treasury Securities"
5. Click "View Rule" → See rule `HQLA_L1_SOVEREIGN`
6. Click "View Records" → See FR 2052a source data
7. Verify amounts and factors are correct

---

### **7. NSFR Validation Tab**
**Purpose:** Net Stable Funding Ratio summary validation

**Features:**
- Submission selector
- NSFR summary metrics:
  - Capital ASF calculated vs expected
  - Retail deposits ASF
  - Wholesale funding ASF
  - Total ASF
  - Level 1, 2A, 2B assets RSF
  - Loans RSF
  - Total RSF
  - NSFR ratio calculated vs expected
  - Overall validation status

- **Color-coded Status:**
  - ✅ Green: Passed
  - ❌ Red: Failed
  - ⚠️ Yellow: Warning

**Current Implementation:**
- Summary-level NSFR data only
- No component-level drill-down yet
- No View Rule/View Records buttons yet

**Use Case:**
- Quick check of NSFR ratio compliance (100% minimum)
- See ASF vs RSF breakdown
- Validate NSFR calculations at summary level
- Identify which NSFR components need investigation

**Note:** NSFR does not have component-level breakdown tables populated yet. The screen shows summary validation only. For full drill-down capability similar to LCR, component tables (`nsfr_asf_components`, `nsfr_rsf_components`) would need to be populated with data.

---

## Calculation Rules Reference

### **Accessing Rules**
**Location:** Left Navigation → "Calculation Rules"

**Features:**
- Standalone reference screen
- All 40 regulatory calculation rules
- Real-time search by name, code, description
- Filter by category dropdown
- Expand any rule to see full details

### **Rule Categories (12 Total)**

**HQLA (High-Quality Liquid Assets):**
1. `HQLA_Level_1` - 4 rules (Cash, Treasuries, CB Reserves, Foreign Sovereign)
2. `HQLA_Level_2A` - 3 rules (GSE, Foreign Sovereign 20%, PSE)
3. `HQLA_Level_2B` - 3 rules (Corporate, Equity, RMBS)

**Cash Outflows:**
4. `Cash_Outflows_Retail` - 2 rules (Stable 3%, Less Stable 10%)
5. `Cash_Outflows_Wholesale` - 3 rules (Operational 25%, Non-Operational 40%, Financial 100%)
6. `Cash_Outflows_Secured` - 3 rules (Level 1 0%, Level 2A 15%, Other 25%)
7. `Cash_Outflows_Derivatives` - 2 rules (Collateral, Option Exercise)
8. `Cash_Outflows_Commitments` - 4 rules (Retail 5%, Corporate 10%, Financial 40%, Liquidity 100%)

**Cash Inflows:**
9. `Cash_Inflows_Contractual` - 3 rules (Loans/Securities, Reverse Repos)
10. `Cash_Inflows_Cap` - 1 rule (75% cap)

**NSFR (Net Stable Funding Ratio):**
11. `NSFR_ASF` - 5 rules (Available Stable Funding factors)
12. `NSFR_RSF` - 7 rules (Required Stable Funding factors)

**Total Rules:** 40 calculation rules aligned with FR 2052a Appendix VI and VII

### **Example: Viewing a Rule**

**Scenario:** "What haircut applies to Level 2B Corporate Debt?"

**Steps:**
1. Navigate to "Calculation Rules"
2. Filter by "HQLA_Level_2B" or search "corporate"
3. Find rule `HQLA_L2B_CORPORATE`
4. Expand to see:
   - **Rule Name:** Level 2B HQLA - Corporate Debt Securities
   - **FR 2052a Reference:** Appendix VI, Section C.1
   - **Regulatory Citation:** 12 CFR 249.20(c)(1)
   - **Formula:** Market Value × 50% haircut
   - **Factor Applied:** 50.00%
   - **Description:** Investment-grade corporate debt with 50% haircut
   - **Examples:** BBB-rated corporate bonds

**Answer:** 50% haircut applies (only 50% of market value counts toward HQLA)

---

## How to Execute Validations

### **Method 1: From Overview Tab**

**Steps:**
1. Navigate to FR 2052a Validation → Overview tab
2. Click "Execute Validations" button
3. Select a submission from dropdown
4. Click "Run Validations"
5. Wait for execution (shows 3-step progress):
   - Step 1: FR2052a Data Validation
   - Step 2: LCR Calculation Validation
   - Step 3: NSFR Calculation Validation
6. View results in LCR/NSFR tabs

### **Method 2: From Data Setup Screen**

**Steps:**
1. Navigate to "Data Setup" (if available in your navigation)
2. Select validation options
3. Execute validations
4. Return to FR 2052a Validation to view results

---

## Understanding LCR Components

### **HQLA Hierarchy**

**Level 1 (100% liquidity value, 0% haircut):**
- Cash
- U.S. Treasury Securities
- Central Bank Reserves
- Certain Foreign Sovereign Debt (0% risk weight)
- **Regulatory Minimum:** None (unlimited)

**Level 2A (85% liquidity value, 15% haircut):**
- GSE Securities (Fannie Mae, Freddie Mac)
- Foreign Sovereign Debt (20% risk weight)
- Public Sector Entity Securities
- **Regulatory Cap:** Maximum 40% of total HQLA

**Level 2B (50% liquidity value, 50% haircut):**
- Investment-grade Corporate Debt
- Publicly-traded Common Equity
- Residential Mortgage-Backed Securities (RMBS)
- **Regulatory Cap:** Maximum 15% of total HQLA (nested within Level 2 40% cap)

### **Cash Outflow Categories**

**Retail Deposits:**
- Stable (≤3% runoff): Transaction accounts with established relationship
- Less Stable (≤10% runoff): No established relationship or high-rate accounts

**Wholesale Funding:**
- Operational (25% runoff): Operational services provided
- Non-Operational (40% runoff): Small business, affiliate, non-financial corporate
- Financial Institution (100% runoff): Other banks, broker-dealers

**Secured Funding (Repos):**
- Backed by Level 1 HQLA (0% runoff)
- Backed by Level 2A HQLA (15% runoff)
- Backed by other collateral (25-100% runoff)

**Derivatives:**
- Excess collateral (100% outflow)
- Option exercise obligations

**Commitment Facilities:**
- Retail (5% drawdown)
- Non-financial corporate (10% drawdown)
- Financial institution (40% drawdown)
- Liquidity facilities (100% drawdown)

### **Cash Inflow Cap**

**Rule:** Total inflows capped at 75% of total outflows

**Rationale:** Ensures minimum 25% liquidity buffer

**Impact:** If inflows > 75% of outflows, excess inflows are disregarded in LCR calculation

---

## Regulatory Compliance

### **LCR Minimum Requirement**
- **Ratio:** ≥ 100%
- **Formula:** HQLA / Net Cash Outflows ≥ 100%
- **Regulatory Citation:** 12 CFR Part 249

### **NSFR Minimum Requirement**
- **Ratio:** ≥ 100%
- **Formula:** Available Stable Funding / Required Stable Funding ≥ 100%
- **Regulatory Citation:** 12 CFR Part 249, Subpart F

### **FR 2052a Reporting**
- **Frequency:** Daily for complex institutions, Monthly for other covered entities
- **Appendix VI:** LCR calculation requirements
- **Appendix VII:** NSFR calculation requirements

---

## Troubleshooting

### **LCR Validation Shows No Data**

**Possible Causes:**
1. No submission selected
2. Validation not executed for submission
3. Component tables not populated

**Solutions:**
1. Select a submission from dropdown
2. Go to Overview tab → Execute Validations
3. Check if validation completed successfully
4. Verify component data exists in database

### **View Rule Button Not Working**

**Possible Causes:**
1. Component missing `rule_code`
2. Rule not found in `lcr_calculation_rules`
3. RLS policy blocking query

**Solutions:**
1. Check browser console for errors
2. Verify rule code is populated on component
3. Verify `lcr_calculation_rules` table has public read access
4. Hard refresh browser (Ctrl+Shift+R)

### **View Records Shows No Data**

**Possible Causes:**
1. FR 2052a source data not linked
2. Product IDs not populated on component
3. Source data deleted

**Solutions:**
1. Check `fr2052a_line_references` array on component
2. Verify FR 2052a data exists for submission
3. Re-run data seeding if necessary

### **NSFR Tab Empty**

**Expected Behavior:** NSFR tab shows summary metrics only

**Explanation:**
- NSFR component tables (`nsfr_asf_components`, `nsfr_rsf_components`) are not populated with detail data
- NSFR validation shows calculated vs expected at summary level only
- For component drill-down, additional data generation would be needed

**Workaround:**
- Use NSFR summary metrics to verify ratio
- View NSFR rules in Calculation Rules screen
- Access detailed NSFR data through other reports if available

---

## Best Practices

### **For Validation Review**
1. Always start with Overview tab to see overall health
2. Execute validations regularly (daily/weekly based on submission frequency)
3. Review Rule Executions tab to ensure all rules ran successfully
4. Investigate any errors in Error Details tab before proceeding
5. Use LCR Validation tab for deep-dive analysis

### **For LCR Analysis**
1. Check LCR ratio first - must be ≥100%
2. Expand each section (HQLA, Outflows, Inflows) to verify composition
3. Use View Rule to understand factors applied
4. Use View Records to verify source data accuracy
5. Pay attention to Level 2 caps (40% for 2A, 15% for 2B)
6. Verify inflow cap applied correctly (75% of outflows)

### **For Regulatory Examination**
1. Print or export summary metrics
2. Document all rule references using View Rule
3. Prepare source data evidence using View Records
4. Review historical trends across multiple submissions
5. Ensure all validations passed before submission to Fed

---

## Technical Details

**Database Tables:**
- `lcr_calculation_rules` - 40 calculation rules (public read access)
- `lcr_calculation_validations` - LCR validation results
- `lcr_hqla_components` - HQLA component details with rule_code
- `lcr_outflow_components` - Outflow component details with rule_code
- `lcr_inflow_components` - Inflow component details with rule_code
- `nsfr_calculation_validations` - NSFR validation results
- `fr2052a_data_rows` - Source FR 2052a data
- `fr2052a_submissions` - Submission metadata

**React Components:**
- `FR2052aValidation.tsx` - Main validation screen (7 tabs)
- `EnhancedLCRValidationScreen.tsx` - LCR component drill-down
- `NSFRValidationScreen.tsx` - NSFR summary validation
- `CalculationRules.tsx` - Calculation rules reference
- `ValidationRuleExecutions.tsx` - Rule execution history

**Key Features:**
- ✅ 40 calculation rules populated
- ✅ LCR validation with View Rule + View Records
- ✅ NSFR summary validation
- ✅ Standalone Calculation Rules screen
- ✅ Real-time search and filtering
- ✅ Public RLS policies for rules
- ✅ Component-level drill-down for LCR
- ⚠️ NSFR component drill-down pending (summary only)

---

## Summary

The FR 2052a Validation screen is the comprehensive hub for regulatory reporting validation. Use it to:
- Execute and track validation runs
- Investigate data quality errors
- Validate LCR calculations with full transparency
- Review NSFR summary metrics
- Access regulatory rules and formulas
- Link calculations back to source data

The LCR Validation tab with View Rule and View Records capabilities provides the most detailed analysis, allowing you to drill down from ratios → components → rules → source data for complete regulatory transparency.

For NSFR, the current implementation provides summary-level validation. For detailed component analysis, use the Calculation Rules screen to understand NSFR factors, and view summary metrics in the NSFR tab.

---

*Document Version: 1.0*
*Last Updated: November 23, 2025*
*Screen: FR 2052a Validation*
*Primary Feature: LCR Validation Tab with View Rule + View Records*
