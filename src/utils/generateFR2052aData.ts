import { FR2052aLineItem } from './fr2052aCalculations';

export function generateComprehensiveFR2052aData(reportDate: string, legalEntityId: string): FR2052aLineItem[] {
  const data: FR2052aLineItem[] = [];
  const baseAmount = 1000000;

  const products = [
    {
      category: 'deposits',
      counterpartyTypes: ['retail', 'wholesale', 'financial_institution'],
      subProducts: ['stable', 'less_stable', 'operational', 'non_operational'],
      maturities: ['overnight', '2-7days', '8-30days', '31-90days', '91-180days', '181-365days', 'gt_1year'],
      isHQLA: false
    },
    {
      category: 'loans',
      counterpartyTypes: ['retail', 'corporate', 'sme', 'financial_institution'],
      subProducts: ['mortgage', 'consumer', 'commercial', 'revolving'],
      maturities: ['overnight', '2-7days', '8-30days', '31-90days', '91-180days', '181-365days', 'gt_1year'],
      assetClasses: ['residential', 'commercial', 'unsecured'],
      isHQLA: false
    },
    {
      category: 'securities',
      counterpartyTypes: ['government', 'corporate', 'financial_institution', 'sovereign'],
      subProducts: ['treasury', 'agency', 'municipal', 'corporate_bond', 'equity'],
      maturities: ['overnight', '2-7days', '8-30days', '31-90days', '91-180days', '181-365days', 'gt_1year'],
      assetClasses: ['government', 'corporate', 'covered_bond', 'equity'],
      isHQLA: true
    },
    {
      category: 'derivatives',
      counterpartyTypes: ['financial_institution', 'corporate', 'hedge_fund'],
      subProducts: ['interest_rate_swap', 'fx_forward', 'credit_default_swap', 'equity_option'],
      maturities: ['overnight', '8-30days', '31-90days', '91-180days', '181-365days', 'gt_1year'],
      assetClasses: ['interest_rate', 'fx', 'credit', 'equity'],
      isHQLA: false
    },
    {
      category: 'secured_funding',
      counterpartyTypes: ['financial_institution', 'central_bank', 'corporate'],
      subProducts: ['repo', 'reverse_repo', 'securities_lending', 'collateral_swap'],
      maturities: ['overnight', '2-7days', '8-30days', '31-90days'],
      assetClasses: ['government', 'corporate', 'equity'],
      isHQLA: false
    },
    {
      category: 'credit_facilities',
      counterpartyTypes: ['retail', 'corporate', 'sme'],
      subProducts: ['committed', 'uncommitted', 'standby_letter_of_credit'],
      maturities: ['open', 'gt_1year'],
      isHQLA: false
    },
    {
      category: 'liquidity_facilities',
      counterpartyTypes: ['special_purpose_vehicle', 'financial_institution'],
      subProducts: ['conduit', 'asset_backed_commercial_paper'],
      maturities: ['open', '8-30days', '31-90days'],
      isHQLA: false
    },
    {
      category: 'capital',
      counterpartyTypes: ['shareholder'],
      subProducts: ['common_equity', 'preferred_stock', 'retained_earnings'],
      maturities: ['open'],
      isHQLA: false
    },
    {
      category: 'other_assets',
      counterpartyTypes: ['various'],
      subProducts: ['cash', 'central_bank_reserves', 'fixed_assets', 'intangibles'],
      maturities: ['overnight', 'open', 'gt_1year'],
      assetClasses: ['cash', 'property', 'intangible'],
      isHQLA: true
    },
    {
      category: 'other_liabilities',
      counterpartyTypes: ['various', 'trade_creditor'],
      subProducts: ['accounts_payable', 'accrued_expenses', 'deferred_revenue'],
      maturities: ['8-30days', '31-90days', 'open'],
      isHQLA: false
    }
  ];

  let idCounter = 1;

  products.forEach(product => {
    product.counterpartyTypes.forEach(counterparty => {
      (product.subProducts || ['standard']).forEach(subProduct => {
        (product.maturities || ['standard']).forEach(maturity => {
          const assetClassList = product.assetClasses || ['standard'];

          assetClassList.forEach(assetClass => {
            const isLiability = ['deposits', 'secured_funding', 'other_liabilities', 'capital'].includes(product.category);
            const isAsset = ['loans', 'securities', 'other_assets'].includes(product.category);
            const isOffBalance = ['credit_facilities', 'liquidity_facilities', 'derivatives'].includes(product.category);

            const productId = `FR2052A-${product.category.toUpperCase()}-${idCounter.toString().padStart(6, '0')}`;
            const productName = `${product.category} - ${subProduct} - ${counterparty} - ${maturity}${assetClass !== 'standard' ? ` - ${assetClass}` : ''}`;

            let isHQLA = false;
            let hqlaLevel = undefined;
            let haircut = 0;

            if (product.category === 'securities') {
              if (assetClass === 'government' && subProduct === 'treasury') {
                isHQLA = true;
                hqlaLevel = 1;
                haircut = 0.0;
              } else if (assetClass === 'government' || subProduct === 'agency') {
                isHQLA = true;
                hqlaLevel = 2;
                haircut = 0.15;
              } else if (assetClass === 'corporate' && subProduct === 'corporate_bond') {
                isHQLA = true;
                hqlaLevel = 3;
                haircut = 0.50;
              }
            } else if (product.category === 'other_assets' && (subProduct === 'cash' || subProduct === 'central_bank_reserves')) {
              isHQLA = true;
              hqlaLevel = 1;
              haircut = 0.0;
            }

            let projectedCashInflow = 0;
            let projectedCashOutflow = 0;

            if (isAsset && product.category !== 'securities') {
              const maturityDays = getMaturityDays(maturity);
              if (maturityDays <= 30) {
                projectedCashInflow = baseAmount * 0.15;
              } else if (maturityDays <= 90) {
                projectedCashInflow = baseAmount * 0.05;
              }
            }

            if (isLiability && product.category === 'deposits') {
              const runoffRate = getDepositRunoffRate(counterparty, subProduct);
              projectedCashOutflow = baseAmount * runoffRate;
            } else if (product.category === 'secured_funding') {
              projectedCashOutflow = baseAmount * 0.25;
            } else if (isOffBalance) {
              projectedCashOutflow = baseAmount * 0.05;
            }

            const netCashFlow = projectedCashInflow - projectedCashOutflow;

            let runoffRate = undefined;
            if (product.category === 'deposits') {
              runoffRate = getDepositRunoffRate(counterparty, subProduct);
            }

            let availableStableFundingFactor = undefined;
            let requiredStableFundingFactor = undefined;

            if (isLiability || product.category === 'capital') {
              availableStableFundingFactor = getASFFactor(product.category, counterparty, subProduct, maturity);
            }

            if (isAsset || isOffBalance) {
              requiredStableFundingFactor = getRSFFactor(product.category, subProduct, maturity, isHQLA, hqlaLevel);
            }

            const encumberedAmount = isHQLA ? baseAmount * 0.1 : 0;

            const rating = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];
            const internalRating = rating[Math.floor(Math.random() * rating.length)];

            data.push({
              productId,
              productName,
              productCategory: product.category,
              subProduct,
              maturityBucket: maturity,
              counterpartyType: counterparty,
              assetClass: assetClass !== 'standard' ? assetClass : undefined,
              currency: 'USD',
              outstandingBalance: baseAmount,
              projectedCashInflow,
              projectedCashOutflow,
              isHQLA,
              hqlaLevel,
              haircut,
              runoffRate,
              requiredStableFundingFactor,
              availableStableFundingFactor,
              encumberedAmount,
              internalRating,
              reportDate
            });

            idCounter++;
          });
        });
      });
    });
  });

  return data;
}

function getMaturityDays(maturityBucket: string): number {
  const maturityMap: { [key: string]: number } = {
    'overnight': 1,
    '2-7days': 5,
    '8-30days': 20,
    '31-90days': 60,
    '91-180days': 135,
    '181-365days': 270,
    'gt_1year': 730,
    'open': 9999
  };
  return maturityMap[maturityBucket] || 0;
}

function getDepositRunoffRate(counterparty: string, subProduct: string): number {
  if (counterparty === 'retail') {
    if (subProduct === 'stable') return 0.03;
    if (subProduct === 'less_stable') return 0.10;
    return 0.10;
  }

  if (counterparty === 'wholesale') {
    if (subProduct === 'operational') return 0.25;
    if (subProduct === 'non_operational') return 0.40;
    return 0.40;
  }

  if (counterparty === 'financial_institution') return 1.00;

  return 0.40;
}

function getASFFactor(category: string, counterparty: string, subProduct: string, maturity: string): number {
  if (category === 'capital') return 1.00;

  if (category === 'deposits') {
    if (counterparty === 'retail') {
      if (subProduct === 'stable') return 0.95;
      if (subProduct === 'less_stable') return 0.90;
      return 0.90;
    }

    if (counterparty === 'wholesale' || counterparty === 'financial_institution') {
      if (subProduct === 'operational') return 0.50;

      const maturityDays = getMaturityDays(maturity);
      if (maturityDays < 180) return 0.0;
      if (maturityDays < 365) return 0.50;
      return 1.00;
    }
  }

  if (category === 'secured_funding') {
    const maturityDays = getMaturityDays(maturity);
    if (maturityDays < 180) return 0.0;
    return 0.50;
  }

  return 0.0;
}

function getRSFFactor(category: string, subProduct: string, maturity: string, isHQLA: boolean, hqlaLevel?: number): number {
  if (isHQLA && hqlaLevel === 1) return 0.0;
  if (isHQLA && hqlaLevel === 2) return 0.15;
  if (isHQLA && hqlaLevel === 3) return 0.50;

  if (category === 'loans') {
    const maturityDays = getMaturityDays(maturity);
    if (maturityDays >= 365 && (subProduct === 'mortgage' || subProduct === 'consumer')) {
      return 0.65;
    }
    return 0.85;
  }

  if (category === 'securities') return 0.85;

  if (category === 'derivatives') return 1.00;
  if (category === 'credit_facilities') return 0.05;
  if (category === 'liquidity_facilities') return 0.05;

  if (category === 'other_assets') {
    if (subProduct === 'cash' || subProduct === 'central_bank_reserves') return 0.0;
    if (subProduct === 'fixed_assets') return 1.00;
    if (subProduct === 'intangibles') return 1.00;
  }

  return 1.00;
}

export interface FR2052aDataRow {
  user_id: string;
  legal_entity_id: string;
  report_date: string;
  product_id: string;
  product_name: string;
  product_category: string;
  sub_product: string | null;
  maturity_bucket: string;
  counterparty_type: string;
  asset_class: string | null;
  currency: string;
  outstanding_balance: number;
  projected_cash_inflow: number;
  projected_cash_outflow: number;
  net_cash_flow: number;
  is_hqla: boolean;
  hqla_level: number | null;
  haircut: number;
  runoff_rate: number | null;
  required_stable_funding_factor: number | null;
  available_stable_funding_factor: number | null;
  encumbered_amount: number;
  internal_rating: string | null;
}

export function convertToDBFormat(items: FR2052aLineItem[], userId: string, legalEntityId: string): FR2052aDataRow[] {
  return items.map(item => ({
    user_id: userId,
    legal_entity_id: legalEntityId,
    report_date: item.reportDate,
    product_id: item.productId,
    product_name: item.productName,
    product_category: item.productCategory,
    sub_product: item.subProduct || null,
    maturity_bucket: item.maturityBucket,
    counterparty_type: item.counterpartyType,
    asset_class: item.assetClass || null,
    currency: item.currency,
    outstanding_balance: item.outstandingBalance,
    projected_cash_inflow: item.projectedCashInflow,
    projected_cash_outflow: item.projectedCashOutflow,
    net_cash_flow: item.projectedCashInflow - item.projectedCashOutflow,
    is_hqla: item.isHQLA,
    hqla_level: item.hqlaLevel || null,
    haircut: item.haircut,
    runoff_rate: item.runoffRate || null,
    required_stable_funding_factor: item.requiredStableFundingFactor || null,
    available_stable_funding_factor: item.availableStableFundingFactor || null,
    encumbered_amount: item.encumberedAmount,
    internal_rating: item.internalRating || null
  }));
}
