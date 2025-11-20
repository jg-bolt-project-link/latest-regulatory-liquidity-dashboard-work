import { supabase } from '../lib/supabase';
import { FR2052aCalculationEngine, FR2052aLineItem } from './fr2052aCalculations';

interface HQLAComponentDetail {
  hqla_level: number;
  hqla_category: string;
  product_category: string;
  asset_class: string | null;
  total_amount: number;
  haircut_rate: number;
  amount_after_haircut: number;
  liquidity_value_factor: number;
  liquidity_value: number;
  fr2052a_line_references: string[];
  record_count: number;
  calculation_notes: string;
}

interface OutflowComponentDetail {
  outflow_category: string;
  product_type: string;
  counterparty_type: string | null;
  maturity_bucket: string | null;
  total_amount: number;
  runoff_rate: number;
  calculated_outflow: number;
  fr2052a_line_references: string[];
  record_count: number;
  calculation_methodology: string;
  regulatory_reference: string;
}

interface InflowComponentDetail {
  inflow_category: string;
  product_type: string;
  counterparty_type: string | null;
  maturity_bucket: string | null;
  total_amount: number;
  inflow_rate: number;
  calculated_inflow: number;
  fr2052a_line_references: string[];
  record_count: number;
  calculation_methodology: string;
  regulatory_reference: string;
}

export class EnhancedFR2052aCalculationEngine extends FR2052aCalculationEngine {
  private data: FR2052aLineItem[];
  private submissionId: string;
  private legalEntityId: string;

  constructor(data: FR2052aLineItem[], submissionId: string, legalEntityId: string) {
    super(data);
    this.data = data;
    this.submissionId = submissionId;
    this.legalEntityId = legalEntityId;
  }

  async calculateAndStoreLCRWithComponents(validationId: string) {
    const lcrResult = this.calculateLCR();

    // Calculate and store HQLA components
    const hqlaComponents = this.calculateHQLAComponents();
    await this.storeHQLAComponents(validationId, hqlaComponents);

    // Calculate and store outflow components
    const outflowComponents = this.calculateOutflowComponents();
    await this.storeOutflowComponents(validationId, outflowComponents);

    // Calculate and store inflow components
    const inflowComponents = this.calculateInflowComponents();
    await this.storeInflowComponents(validationId, inflowComponents);

    return lcrResult;
  }

  private calculateHQLAComponents(): HQLAComponentDetail[] {
    const components: HQLAComponentDetail[] = [];

    // Group HQLA assets by level and category
    const hqlaGroups = new Map<string, {
      items: FR2052aLineItem[];
      level: number;
      category: string;
      assetClass: string | null;
    }>();

    this.data.forEach(item => {
      if (item.isHQLA && item.hqlaLevel) {
        const key = `${item.hqlaLevel}-${item.productCategory}-${item.assetClass || 'none'}`;
        if (!hqlaGroups.has(key)) {
          hqlaGroups.set(key, {
            items: [],
            level: item.hqlaLevel,
            category: item.productCategory,
            assetClass: item.assetClass || null
          });
        }
        hqlaGroups.get(key)!.items.push(item);
      }
    });

    // Process each HQLA group
    hqlaGroups.forEach((group) => {
      const totalAmount = group.items.reduce((sum, item) => sum + item.outstandingBalance, 0);
      const avgHaircut = group.items.length > 0
        ? group.items.reduce((sum, item) => sum + item.haircut, 0) / group.items.length
        : 0;

      const amountAfterHaircut = totalAmount * (1 - avgHaircut);

      let liquidityValueFactor = 1.0;
      let categoryName = 'Level 1 Assets';
      let notes = 'No haircut, 100% liquidity value';

      if (group.level === 1) {
        liquidityValueFactor = 1.0;
        categoryName = group.category === 'cash' ? 'Cash and Central Bank Reserves' : 'U.S. Treasury Securities';
        notes = 'Level 1 HQLA: No haircut, 100% liquidity value';
      } else if (group.level === 2) {
        liquidityValueFactor = 0.85;
        categoryName = 'GSE Securities';
        notes = 'Level 2A HQLA: 15% haircut, 85% liquidity value';
      } else if (group.level === 3) {
        liquidityValueFactor = 0.50;
        categoryName = 'Corporate Debt Securities';
        notes = 'Level 2B HQLA: 50% haircut, 50% liquidity value';
      }

      const liquidityValue = amountAfterHaircut * liquidityValueFactor;

      components.push({
        hqla_level: group.level,
        hqla_category: categoryName,
        product_category: group.category,
        asset_class: group.assetClass,
        total_amount: totalAmount,
        haircut_rate: avgHaircut,
        amount_after_haircut: amountAfterHaircut,
        liquidity_value_factor: liquidityValueFactor,
        liquidity_value: liquidityValue,
        fr2052a_line_references: group.items.map(item => item.productId),
        record_count: group.items.length,
        calculation_notes: notes
      });
    });

    return components;
  }

  private calculateOutflowComponents(): OutflowComponentDetail[] {
    const components: OutflowComponentDetail[] = [];

    // Group by category, product type, and counterparty
    const outflowGroups = new Map<string, {
      items: FR2052aLineItem[];
      category: string;
      productType: string;
      counterpartyType: string | null;
      maturityBucket: string | null;
    }>();

    this.data.forEach(item => {
      // Retail deposits
      if (item.productCategory === 'deposits' && item.counterpartyType === 'retail') {
        const isStable = item.outstandingBalance <= 250000; // Simplified logic
        const key = `retail-${isStable ? 'stable' : 'less-stable'}`;

        if (!outflowGroups.has(key)) {
          outflowGroups.set(key, {
            items: [],
            category: 'Cash_Outflows_Retail',
            productType: isStable ? 'Stable Retail Deposits' : 'Less Stable Retail Deposits',
            counterpartyType: 'retail',
            maturityBucket: null
          });
        }
        outflowGroups.get(key)!.items.push(item);
      }

      // Wholesale deposits
      else if (item.productCategory === 'deposits' &&
               (item.counterpartyType === 'wholesale' || item.counterpartyType === 'financial_institution')) {
        const isFinancial = item.counterpartyType === 'financial_institution';
        const isOperational = item.maturityBucket === 'overnight' || item.maturityBucket === '2-7days';

        let productType = '';
        if (isFinancial) {
          productType = 'Financial Institution Deposits';
        } else if (isOperational) {
          productType = 'Operational Wholesale Deposits';
        } else {
          productType = 'Non-Operational Wholesale Deposits';
        }

        const key = `wholesale-${productType}`;
        if (!outflowGroups.has(key)) {
          outflowGroups.set(key, {
            items: [],
            category: 'Cash_Outflows_Wholesale',
            productType,
            counterpartyType: item.counterpartyType,
            maturityBucket: null
          });
        }
        outflowGroups.get(key)!.items.push(item);
      }

      // Secured funding
      else if (item.productCategory === 'secured_funding' || item.productCategory === 'repo') {
        const key = 'secured-funding';
        if (!outflowGroups.has(key)) {
          outflowGroups.set(key, {
            items: [],
            category: 'Cash_Outflows_Secured',
            productType: 'Secured Funding',
            counterpartyType: null,
            maturityBucket: item.maturityBucket
          });
        }
        outflowGroups.get(key)!.items.push(item);
      }

      // Derivatives
      else if (item.productCategory === 'derivatives' && item.projectedCashOutflow > 0) {
        const key = 'derivatives';
        if (!outflowGroups.has(key)) {
          outflowGroups.set(key, {
            items: [],
            category: 'Cash_Outflows_Derivatives',
            productType: 'Derivative Collateral Outflows',
            counterpartyType: null,
            maturityBucket: null
          });
        }
        outflowGroups.get(key)!.items.push(item);
      }

      // Contingent outflows
      else if (item.productCategory === 'credit_facilities' || item.productCategory === 'liquidity_facilities') {
        const key = 'contingent';
        if (!outflowGroups.has(key)) {
          outflowGroups.set(key, {
            items: [],
            category: 'Cash_Outflows_Contingent',
            productType: 'Credit and Liquidity Facilities',
            counterpartyType: null,
            maturityBucket: null
          });
        }
        outflowGroups.get(key)!.items.push(item);
      }
    });

    // Process each outflow group
    outflowGroups.forEach((group) => {
      const totalAmount = group.items.reduce((sum, item) => sum + item.outstandingBalance, 0);
      let runoffRate = 0;
      let calculatedOutflow = 0;
      let methodology = '';
      let regulatoryReference = '';

      // Determine runoff rate based on category and product type
      if (group.category === 'Cash_Outflows_Retail') {
        if (group.productType.includes('Stable')) {
          runoffRate = 0.03;
          methodology = 'Outstanding Balance × 3% runoff rate';
          regulatoryReference = 'OUTFLOW_RETAIL_STABLE';
        } else {
          runoffRate = 0.10;
          methodology = 'Outstanding Balance × 10% runoff rate';
          regulatoryReference = 'OUTFLOW_RETAIL_LESS_STABLE';
        }
        calculatedOutflow = totalAmount * runoffRate;
      } else if (group.category === 'Cash_Outflows_Wholesale') {
        if (group.productType.includes('Financial Institution')) {
          runoffRate = 1.00;
          methodology = 'Outstanding Balance × 100% runoff rate';
          regulatoryReference = 'OUTFLOW_WHOLESALE_UNSECURED_NONFINANCIAL_100';
        } else if (group.productType.includes('Operational')) {
          runoffRate = 0.25;
          methodology = 'Outstanding Balance × 25% runoff rate';
          regulatoryReference = 'OUTFLOW_WHOLESALE_UNSECURED_OPERATIONAL';
        } else {
          runoffRate = 0.40;
          methodology = 'Outstanding Balance × 40% runoff rate';
          regulatoryReference = 'OUTFLOW_WHOLESALE_UNSECURED_NONOPERATIONAL';
        }
        calculatedOutflow = totalAmount * runoffRate;
      } else if (group.category === 'Cash_Outflows_Secured') {
        calculatedOutflow = group.items.reduce((sum, item) => {
          const collateralValue = item.outstandingBalance * 0.95; // Simplified
          return sum + Math.max(0, item.outstandingBalance - collateralValue);
        }, 0);
        runoffRate = totalAmount > 0 ? calculatedOutflow / totalAmount : 0;
        methodology = 'Outstanding Balance - Collateral Value × (1 - HQLA Haircut)';
        regulatoryReference = 'OUTFLOW_SECURED_FUNDING';
      } else if (group.category === 'Cash_Outflows_Derivatives') {
        calculatedOutflow = group.items.reduce((sum, item) => sum + item.projectedCashOutflow, 0);
        runoffRate = totalAmount > 0 ? calculatedOutflow / totalAmount : 0;
        methodology = 'Projected collateral outflow based on adverse market movements';
        regulatoryReference = 'OUTFLOW_DERIVATIVES';
      } else if (group.category === 'Cash_Outflows_Contingent') {
        runoffRate = 0.05;
        calculatedOutflow = totalAmount * runoffRate;
        methodology = 'Committed Amount × 5% drawdown rate';
        regulatoryReference = 'OUTFLOW_CREDIT_LIQUIDITY_FACILITIES';
      }

      components.push({
        outflow_category: group.category,
        product_type: group.productType,
        counterparty_type: group.counterpartyType,
        maturity_bucket: group.maturityBucket,
        total_amount: totalAmount,
        runoff_rate: runoffRate,
        calculated_outflow: calculatedOutflow,
        fr2052a_line_references: group.items.map(item => item.productId),
        record_count: group.items.length,
        calculation_methodology: methodology,
        regulatory_reference: regulatoryReference
      });
    });

    return components;
  }

  private calculateInflowComponents(): InflowComponentDetail[] {
    const components: InflowComponentDetail[] = [];

    // Group by product type
    const inflowGroups = new Map<string, {
      items: FR2052aLineItem[];
      category: string;
      productType: string;
      counterpartyType: string | null;
    }>();

    this.data.forEach(item => {
      if (item.projectedCashInflow > 0) {
        const maturityDays = this.getMaturityDays(item.maturityBucket);

        if (maturityDays <= 30) {
          let category = '';
          let productType = '';

          if (item.productCategory === 'loans') {
            category = 'Cash_Inflows_Contractual';
            productType = 'Maturing Loans';
          } else if (item.productCategory === 'securities') {
            category = 'Cash_Inflows_Contractual';
            productType = 'Maturing Securities';
          } else if (item.productCategory === 'reverse_repo') {
            category = 'Cash_Inflows_Contractual';
            productType = item.counterpartyType === 'central_bank'
              ? 'Reverse Repos with Central Banks'
              : 'Other Reverse Repos';
          } else {
            category = 'Cash_Inflows_Contractual';
            productType = 'Other Contractual Inflows';
          }

          const key = `${category}-${productType}`;
          if (!inflowGroups.has(key)) {
            inflowGroups.set(key, {
              items: [],
              category,
              productType,
              counterpartyType: item.counterpartyType
            });
          }
          inflowGroups.get(key)!.items.push(item);
        }
      }
    });

    // Process each inflow group
    inflowGroups.forEach((group) => {
      const totalAmount = group.items.reduce((sum, item) => sum + item.projectedCashInflow, 0);
      let inflowRate = 0.50; // Default 50% for most inflows
      let methodology = 'Contractual Cash Inflow × 50% inflow rate';
      let regulatoryReference = 'INFLOW_LOANS_MATURING';

      if (group.productType.includes('Central Bank')) {
        inflowRate = 1.00;
        methodology = 'Contractual Cash Inflow × 100% inflow rate';
        regulatoryReference = 'INFLOW_REVERSE_REPO_CENTRAL_BANK';
      }

      const calculatedInflow = totalAmount * inflowRate;

      components.push({
        inflow_category: group.category,
        product_type: group.productType,
        counterparty_type: group.counterpartyType,
        maturity_bucket: null,
        total_amount: totalAmount,
        inflow_rate: inflowRate,
        calculated_inflow: calculatedInflow,
        fr2052a_line_references: group.items.map(item => item.productId),
        record_count: group.items.length,
        calculation_methodology: methodology,
        regulatory_reference: regulatoryReference
      });
    });

    return components;
  }

  private getMaturityDays(maturityBucket: string): number {
    const bucketMap: Record<string, number> = {
      'overnight': 1,
      '2-7days': 7,
      '8-30days': 30,
      '31-90days': 90,
      '91-180days': 180,
      '181-365days': 365,
      '>365days': 400
    };
    return bucketMap[maturityBucket] || 400;
  }

  private async storeHQLAComponents(validationId: string, components: HQLAComponentDetail[]) {
    for (const component of components) {
      const { error } = await supabase
        .from('lcr_hqla_components')
        .insert({
          lcr_validation_id: validationId,
          submission_id: this.submissionId,
          ...component
        });

      if (error) {
        console.error('Error storing HQLA component:', error);
      }
    }
  }

  private async storeOutflowComponents(validationId: string, components: OutflowComponentDetail[]) {
    for (const component of components) {
      const { error } = await supabase
        .from('lcr_outflow_components')
        .insert({
          lcr_validation_id: validationId,
          submission_id: this.submissionId,
          ...component
        });

      if (error) {
        console.error('Error storing outflow component:', error);
      }
    }
  }

  private async storeInflowComponents(validationId: string, components: InflowComponentDetail[]) {
    for (const component of components) {
      const { error } = await supabase
        .from('lcr_inflow_components')
        .insert({
          lcr_validation_id: validationId,
          submission_id: this.submissionId,
          ...component
        });

      if (error) {
        console.error('Error storing inflow component:', error);
      }
    }
  }
}
