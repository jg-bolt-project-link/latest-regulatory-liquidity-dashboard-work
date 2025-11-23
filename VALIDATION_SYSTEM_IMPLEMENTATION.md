# Validation System Implementation - Complete Guide

## Overview

The Liquidity Hub application now features comprehensive validation and calculation rule drill-down capabilities across multiple regulatory metrics. This document describes the full implementation covering LCR, NSFR, and the foundation for capital, balance sheet, and stress testing validations.

---

## System Architecture

### **Core Components**

**1. Calculation Rules Database**
- **Table:** `lcr_calculation_rules`
- **Purpose:** Central repository for all regulatory calculation rules
- **Coverage:** LCR, NSFR (ASF & RSF)
- **Total Rules:** 40 rules across 12 categories
- **Access:** Public read access (no authentication required)

**2. Component Tables with Rule References**

All component tables now include `rule_code` column for drill-down:

| Table | Purpose | Rule Reference |
|-------|---------|----------------|
| `lcr_hqla_components` | LCR High-Quality Liquid Assets | HQLA_L1_*, HQLA_L2A_*, HQLA_L2B_* |
| `lcr_outflow_components` | LCR Cash Outflows | OUTFLOW_* |
| `lcr_inflow_components` | LCR Cash Inflows | INFLOW_* |
| `nsfr_asf_components` | NSFR Available Stable Funding | NSFR_ASF_* |
| `nsfr_rsf_components` | NSFR Required Stable Funding | NSFR_RSF_* |

**3. Validation Screens**

- **EnhancedLCRValidationScreen** - LCR validation with component drill-down
- **EnhancedNSFRValidationScreen** - NSFR validation with component drill-down
- **CalculationRules** - Standalone rules reference screen

---

## Features Implemented

### **1. View Rule (Calculation Rule Drill-Down)**

**Functionality:**
- Click "View Rule" button on any component
- Opens modal showing complete rule details
- Includes formula, factors, regulatory citations, examples

**Available On:**
- ✅ LCR Validation Screen (all HQLA, Outflow, Inflow components)
- ✅ NSFR Validation Screen (all ASF, RSF components)
- ✅ Calculation Rules Screen (browse all rules)

**Rule Details Displayed:**
- Rule Code (e.g., `HQLA_L1_SOVEREIGN`)
- Rule Name
- FR 2052a Appendix Reference
- Regulatory Citation (12 CFR 249)
- Calculation Formula
- Factor Applied (percentage)
- Description
- Examples

**Data Flow:**
```
Component → rule_code → lcr_calculation_rules → Modal Display
```

### **2. View Records (Source Data Drill-Down)**

**Functionality:**
- Click "View Records" button on any component
- Shows FR 2052a source data rows used in calculation
- Links component calculations back to raw data

**Available On:**
- ✅ LCR Validation Screen (HQLA, Outflow, Inflow components)
- ⚠️ NSFR Validation Screen (placeholder - to be fully implemented)

**Data Flow:**
```
Component → product_ids → fr2052a_data_rows → Table Display
```

### **3. Calculation Rules Reference Screen**

**Location:** Left Navigation → "Calculation Rules"

**Features:**
- Search by rule name, code, or description
- Filter by category dropdown
- Expand/collapse rule details
- View all 40 rules across 12 categories
- Real-time statistics (rules found, categories shown)

**Categories:**
- HQLA Level 1, 2A, 2B (10 rules)
- Cash Outflows: Retail, Wholesale, Secured, Derivatives, Commitments (14 rules)
- Cash Inflows: Contractual, Cap (4 rules)
- NSFR ASF & RSF (12 rules)

---

## Implementation Status by Area

### **✅ Fully Implemented: LCR (Liquidity Coverage Ratio)**

**Validation Screen:** `EnhancedLCRValidationScreen`

**Components with View Rule + View Records:**
- **HQLA (High-Quality Liquid Assets)**
  - Level 1 Assets: Cash, U.S. Treasuries, Central Bank Reserves, Foreign Sovereign
  - Level 2A Assets: GSE Securities, Foreign Sovereign (20% risk), PSE Securities
  - Level 2B Assets: Corporate Debt, Common Equity, RMBS

- **Cash Outflows**
  - Retail: Stable (3%), Less Stable (10%)
  - Wholesale: Operational (25%), Non-Operational (40%), Financial (100%)
  - Secured: Level 1 (0%), Level 2A (15%), Other (25%)
  - Derivatives: Collateral, Option Exercise
  - Commitments: Retail (5%), Corporate (10%), Financial (40%), Liquidity (100%)

- **Cash Inflows**
  - Contractual: Maturing Loans/Securities, Reverse Repos
  - Inflow Cap (75%)

**Rule Coverage:** 28 LCR rules

**Features:**
- ✅ Component-level drill-down
- ✅ View Rule modal with complete regulatory details
- ✅ View Records modal showing FR 2052a source data
- ✅ Expandable/collapsible sections
- ✅ Real-time calculations display
- ✅ Submission selector
- ✅ Summary metrics card

---

### **✅ Fully Implemented: NSFR (Net Stable Funding Ratio)**

**Validation Screen:** `EnhancedNSFRValidationScreen`

**Components with View Rule (View Records placeholder):**
- **Available Stable Funding (ASF)**
  - Regulatory Capital (100%)
  - Retail Deposits: Stable (95%), Less Stable (90%)
  - Wholesale: Operational (50%), > 1 Year (100%)

- **Required Stable Funding (RSF)**
  - Cash & CB Reserves (0%)
  - HQLA: Level 1 (5%), Level 2A (15%)
  - Loans: Mortgages (65%), Corporate (85%), Financial (85%)
  - Securities: Equity (85%)

**Rule Coverage:** 12 NSFR rules

**Features:**
- ✅ Component-level drill-down
- ✅ View Rule modal with complete regulatory details
- ⚠️ View Records placeholder (to be implemented)
- ✅ Expandable/collapsible sections
- ✅ ASF/RSF breakdown
- ✅ NSFR ratio display with compliance status
- ✅ Submission selector
- ✅ Summary metrics card

---

### **⚠️ Partially Implemented: Capital Metrics**

**Current State:**
- ✅ Database tables exist (`balance_sheet_metrics`)
- ✅ Capital metrics stored (Tier 1 capital, RWA, capital ratios)
- ✅ Display in Capital Metrics Detail View
- ❌ No validation screen yet
- ❌ No calculation rule drill-down yet

**Required for Full Implementation:**
1. Create capital calculation rules (Basel III requirements)
2. Create capital component breakdown tables
3. Add `rule_code` to capital component tables
4. Build `CapitalValidationScreen` with View Rule capability
5. Populate capital calculation rules in database

**Example Capital Rules Needed:**
- CET1 Capital Ratio (4.5% minimum)
- Tier 1 Capital Ratio (6.0% minimum)
- Total Capital Ratio (8.0% minimum)
- Leverage Ratio (3.0% minimum for BHCs)
- Capital Conservation Buffer (2.5%)
- G-SIB Surcharge (0.5% - 3.5%)

---

### **⚠️ Partially Implemented: Balance Sheet Metrics**

**Current State:**
- ✅ Database tables exist (`balance_sheet_metrics`)
- ✅ Balance sheet data stored
- ✅ Display in Balance Sheet Detail View
- ❌ No validation screen yet
- ❌ No calculation rule drill-down yet

**Required for Full Implementation:**
1. Create balance sheet validation rules
2. Create component breakdown for assets/liabilities
3. Add `rule_code` to component tables
4. Build `BalanceSheetValidationScreen`
5. Populate validation rules

**Example Balance Sheet Rules Needed:**
- Asset Classification Rules
- Liability Classification Rules
- Equity Calculation Rules
- Balance Sheet Reconciliation Rules
- Allowance for Loan Losses (ALLL) Rules

---

### **⚠️ Partially Implemented: Stress Testing**

**Current State:**
- ✅ Database tables exist (`liquidity_stress_tests`)
- ✅ Stress test scenarios stored
- ✅ Basic stress test functionality
- ❌ No validation screen yet
- ❌ No calculation rule drill-down yet

**Required for Full Implementation:**
1. Create stress test calculation rules (CCAR/DFAST)
2. Create stress scenario component tables
3. Add `rule_code` to scenario components
4. Build `StressTestValidationScreen`
5. Populate stress testing rules

**Example Stress Test Rules Needed:**
- Severely Adverse Scenario Parameters
- Baseline Scenario Parameters
- Deposit Runoff Under Stress
- Asset Haircuts Under Stress
- Credit Line Drawdown Under Stress
- Loss Projection Methodologies

---

## Database Schema Overview

### **Calculation Rules Table**

```sql
lcr_calculation_rules (
  id UUID PRIMARY KEY,
  rule_code TEXT UNIQUE,              -- e.g., 'HQLA_L1_SOVEREIGN'
  rule_category TEXT,                 -- e.g., 'HQLA_Level_1'
  rule_name TEXT,                     -- e.g., 'Level 1 HQLA - U.S. Treasury Securities'
  fr2052a_appendix_reference TEXT,    -- e.g., 'Appendix VI, Section A.2'
  calculation_formula TEXT,           -- e.g., 'Market Value × 100% (no haircut)'
  factor_applied NUMERIC,             -- e.g., 1.0 (100%)
  rule_description TEXT,
  regulatory_citation TEXT,           -- e.g., '12 CFR 249.20(a)(1)'
  examples TEXT,
  created_at TIMESTAMPTZ
)
```

### **Component Tables (LCR Example)**

```sql
lcr_hqla_components (
  id UUID PRIMARY KEY,
  lcr_validation_id UUID,
  submission_id UUID,
  hqla_level INTEGER,                 -- 1, 2, or 3
  hqla_category TEXT,                 -- e.g., 'U.S. Treasury Securities'
  product_category TEXT,
  total_amount NUMERIC,
  haircut_rate NUMERIC,
  liquidity_value NUMERIC,
  rule_code TEXT,                     -- → lcr_calculation_rules.rule_code
  fr2052a_line_references TEXT[],
  created_at TIMESTAMPTZ
)
```

### **NSFR Component Tables**

```sql
nsfr_asf_components (
  id UUID PRIMARY KEY,
  nsfr_validation_id UUID,
  submission_id UUID,
  asf_category TEXT,
  product_type TEXT,
  total_amount NUMERIC,
  asf_factor NUMERIC,                 -- e.g., 0.95 for stable retail
  calculated_asf NUMERIC,
  rule_code TEXT,                     -- → lcr_calculation_rules.rule_code
  created_at TIMESTAMPTZ
)

nsfr_rsf_components (
  id UUID PRIMARY KEY,
  nsfr_validation_id UUID,
  submission_id UUID,
  rsf_category TEXT,
  product_type TEXT,
  asset_class TEXT,
  total_amount NUMERIC,
  rsf_factor NUMERIC,                 -- e.g., 0.65 for mortgages
  calculated_rsf NUMERIC,
  rule_code TEXT,                     -- → lcr_calculation_rules.rule_code
  created_at TIMESTAMPTZ
)
```

---

## How to Use the System

### **1. View LCR Validation with Drill-Down**

**Steps:**
1. Navigate to **LCR Validation** in left panel
2. Select a submission from dropdown
3. Expand HQLA, Outflows, or Inflows sections
4. For any component:
   - Click **"View Rule"** → See calculation rule details
   - Click **"View Records"** → See FR 2052a source data
5. Modal opens with complete details
6. Close modal to return to validation screen

**Example Use Case:**
- Question: "How are U.S. Treasuries treated in LCR?"
- Navigate to LCR Validation
- Expand HQLA → Level 1 Assets
- Find "U.S. Treasury Securities"
- Click "View Rule"
- See: Rule `HQLA_L1_SOVEREIGN`, Factor: 100%, No haircut, 12 CFR 249.20(a)(1)

### **2. View NSFR Validation with Drill-Down**

**Steps:**
1. Navigate to **NSFR Validation** in left panel
2. Select a submission from dropdown
3. Expand ASF or RSF sections
4. For any component:
   - Click **"View Rule"** → See calculation rule details
   - (View Records coming soon)
5. Modal opens with NSFR rule details

**Example Use Case:**
- Question: "What ASF factor applies to stable retail deposits?"
- Navigate to NSFR Validation
- Expand Available Stable Funding (ASF)
- Find "Stable Retail Deposits"
- Click "View Rule"
- See: Rule `NSFR_ASF_RETAIL_STABLE`, Factor: 95%, 12 CFR 249.103(b)(1)

### **3. Browse All Calculation Rules**

**Steps:**
1. Navigate to **Calculation Rules** in left panel
2. Use search box or category filter
3. Click any rule to expand full details
4. View formula, factor, citations, examples

**Example Use Case:**
- Question: "What are all the HQLA Level 2B haircuts?"
- Navigate to Calculation Rules
- Filter by "HQLA_Level_2B"
- See 3 rules: Corporate (50%), Equity (50%), RMBS (50%)
- Expand each to see details

---

## Testing Validation Screens

### **Testing LCR Validation**

**Prerequisites:**
- FR 2052a submission must exist
- LCR validation must be executed (creates `lcr_calculation_validations` record)
- Components must be created (`lcr_hqla_components`, `lcr_outflow_components`, `lcr_inflow_components`)

**Test Procedure:**
1. Go to **Data Setup** → Execute validations for a submission
2. Navigate to **LCR Validation**
3. Select the validated submission
4. Verify:
   - Summary card shows HQLA, Outflows, Inflows, LCR ratio
   - HQLA section expandable with components listed
   - Each component shows amounts, factors, calculated values
   - "View Rule" button opens modal with rule details
   - "View Records" button shows FR 2052a source data
5. Test all three sections (HQLA, Outflows, Inflows)

### **Testing NSFR Validation**

**Prerequisites:**
- FR 2052a submission must exist
- NSFR validation must be executed (creates `nsfr_calculation_validations` record)
- Components must be created (`nsfr_asf_components`, `nsfr_rsf_components`)

**Test Procedure:**
1. Go to **Data Setup** → Execute NSFR validations
2. Navigate to **NSFR Validation**
3. Select the validated submission
4. Verify:
   - Summary card shows ASF, RSF, NSFR ratio
   - ASF section expandable with components listed
   - RSF section expandable with components listed
   - Each component shows amounts, factors, calculated values
   - "View Rule" button opens modal with rule details
5. Test both sections (ASF, RSF)

---

## Extending to Other Metrics

### **Template for Creating New Validation Screens**

To extend this system to Capital, Balance Sheet, or Stress Testing:

**1. Create Component Tables**
```sql
CREATE TABLE capital_components (
  id UUID PRIMARY KEY,
  validation_id UUID,
  component_category TEXT,          -- e.g., 'CET1', 'Tier1', 'Tier2'
  component_name TEXT,
  amount NUMERIC,
  rule_code TEXT,                   -- → lcr_calculation_rules.rule_code
  calculation_notes TEXT,
  created_at TIMESTAMPTZ
);
```

**2. Populate Calculation Rules**
```sql
INSERT INTO lcr_calculation_rules (
  rule_code, rule_category, rule_name,
  fr2052a_appendix_reference, calculation_formula,
  factor_applied, rule_description, regulatory_citation
) VALUES (
  'CAPITAL_CET1_RATIO',
  'Capital_Ratios',
  'Common Equity Tier 1 Ratio',
  'Basel III Framework',
  'CET1 Capital / Risk-Weighted Assets',
  0.045,                            -- 4.5% minimum
  'Minimum CET1 capital ratio under Basel III',
  '12 CFR 217.10'
);
```

**3. Create Validation Screen Component**

Copy `EnhancedNSFRValidationScreen.tsx` as template:
- Replace NSFR-specific logic with new metric logic
- Update component queries
- Keep View Rule modal (reusable)
- Implement View Records for source data

**4. Add to Navigation**

Update `MainApp.tsx`:
```typescript
import { CapitalValidationScreen } from './validation/CapitalValidationScreen';

// Add to navigation
{ id: 'capital-validation', label: 'Capital Validation', icon: Shield }

// Add to renderContent
case 'capital-validation':
  return <CapitalValidationScreen />;
```

---

## Summary of Current Implementation

### **✅ Completed**
- 40 calculation rules populated (LCR + NSFR)
- Calculation Rules reference screen
- Enhanced LCR Validation Screen with View Rule + View Records
- Enhanced NSFR Validation Screen with View Rule
- Navigation integration
- Public RLS policies for rule access
- rule_code added to all component tables
- Modal components for rule display
- Search and filter capabilities

### **⚠️ In Progress / Partially Implemented**
- NSFR View Records (placeholder exists)
- Capital validation screens
- Balance sheet validation screens
- Stress testing validation screens

### **📋 Roadmap for Full Implementation**

**Phase 1: Complete NSFR** (2-4 hours)
- Implement View Records for NSFR components
- Link NSFR components to FR 2052a data

**Phase 2: Capital Metrics** (4-6 hours)
- Create capital calculation rules (15-20 rules)
- Create capital component tables
- Build CapitalValidationScreen
- Implement View Rule + View Records

**Phase 3: Balance Sheet** (4-6 hours)
- Create balance sheet validation rules
- Create balance sheet component tables
- Build BalanceSheetValidationScreen
- Implement View Rule + View Records

**Phase 4: Stress Testing** (6-8 hours)
- Create stress test calculation rules
- Create stress scenario component tables
- Build StressTestValidationScreen
- Implement View Rule + View Records

---

## Regulatory Compliance

### **FR 2052a Appendix VI Coverage**
✅ **Sections A-C: HQLA** - Fully implemented (10 rules)
✅ **Sections D: Cash Outflows** - Fully implemented (14 rules)
✅ **Section E: Cash Inflows** - Fully implemented (4 rules)

### **FR 2052a Appendix VII Coverage (NSFR)**
✅ **Section A: ASF** - Fully implemented (5 rules)
✅ **Section B: RSF** - Fully implemented (7 rules)

### **Basel III Capital Framework**
⚠️ **Capital Ratios** - Not yet implemented
⚠️ **Risk-Weighted Assets** - Not yet implemented
⚠️ **Capital Buffers** - Not yet implemented

### **CCAR/DFAST Stress Testing**
⚠️ **Stress Scenarios** - Not yet implemented
⚠️ **Loss Projections** - Not yet implemented

---

## Technical Details

**Build Status:** ✅ Successful
**Bundle Size:** 1.1 MB (gzip: 291 KB)
**Total Rules:** 40
**Validation Screens:** 2 (LCR, NSFR)
**Component Tables:** 5 with rule_code
**Database Migrations:** 3 applied

**Key Files:**
- `/src/components/validation/EnhancedLCRValidationScreen.tsx` (1,000+ lines)
- `/src/components/validation/EnhancedNSFRValidationScreen.tsx` (600+ lines)
- `/src/components/CalculationRules.tsx` (400+ lines)
- `/supabase/migrations/*calculation_rules*.sql` (3 files)

---

*Document Version: 1.0*
*Last Updated: November 23, 2025*
*Implementation Status: LCR ✅ Complete | NSFR ✅ Complete | Capital ⚠️ Pending | Balance Sheet ⚠️ Pending | Stress Testing ⚠️ Pending*
