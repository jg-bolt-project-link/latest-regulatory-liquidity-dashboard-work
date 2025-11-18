export interface FR2052aLineItem {
  productId: string;
  productName: string;
  productCategory: string;
  subProduct?: string;
  maturityBucket: string;
  counterpartyType: string;
  assetClass?: string;
  currency: string;
  outstandingBalance: number;
  projectedCashInflow: number;
  projectedCashOutflow: number;
  isHQLA: boolean;
  hqlaLevel?: number;
  haircut: number;
  runoffRate?: number;
  requiredStableFundingFactor?: number;
  availableStableFundingFactor?: number;
  encumberedAmount: number;
  internalRating?: string;
  reportDate: string;
}

export interface LCRCalculationResult {
  totalHQLA: number;
  level1Assets: number;
  level2aAssets: number;
  level2bAssets: number;
  totalCashOutflows: number;
  totalCashInflows: number;
  netCashOutflows: number;
  lcrRatio: number;
  isCompliant: boolean;
  details: {
    retailDepositOutflows: number;
    wholesaleFundingOutflows: number;
    securedFundingOutflows: number;
    derivativesOutflows: number;
    otherContractualOutflows: number;
    otherContingentOutflows: number;
    cappedInflows: number;
  };
}

export interface NSFRCalculationResult {
  availableStableFunding: number;
  requiredStableFunding: number;
  nsfrRatio: number;
  isCompliant: boolean;
  details: {
    capitalASF: number;
    retailDepositsASF: number;
    wholesaleFundingASF: number;
    otherLiabilitiesASF: number;
    level1AssetsRSF: number;
    level2aAssetsRSF: number;
    level2bAssetsRSF: number;
    loansRSF: number;
    otherAssetsRSF: number;
  };
}

export class FR2052aCalculationEngine {
  private data: FR2052aLineItem[];

  constructor(data: FR2052aLineItem[]) {
    this.data = data;
  }

  calculateLCR(): LCRCalculationResult {
    const hqla = this.calculateHQLA();
    const outflows = this.calculateCashOutflows();
    const inflows = this.calculateCashInflows();

    const netCashOutflows = Math.max(outflows.total - Math.min(inflows.total, outflows.total * 0.75), outflows.total * 0.25);
    const lcrRatio = netCashOutflows > 0 ? hqla.total / netCashOutflows : 0;

    return {
      totalHQLA: hqla.total,
      level1Assets: hqla.level1,
      level2aAssets: hqla.level2a,
      level2bAssets: hqla.level2b,
      totalCashOutflows: outflows.total,
      totalCashInflows: inflows.total,
      netCashOutflows,
      lcrRatio,
      isCompliant: lcrRatio >= 1.0,
      details: {
        retailDepositOutflows: outflows.retailDeposits,
        wholesaleFundingOutflows: outflows.wholesaleFunding,
        securedFundingOutflows: outflows.securedFunding,
        derivativesOutflows: outflows.derivatives,
        otherContractualOutflows: outflows.otherContractual,
        otherContingentOutflows: outflows.otherContingent,
        cappedInflows: Math.min(inflows.total, outflows.total * 0.75)
      }
    };
  }

  calculateNSFR(): NSFRCalculationResult {
    const asf = this.calculateAvailableStableFunding();
    const rsf = this.calculateRequiredStableFunding();

    const nsfrRatio = rsf.total > 0 ? asf.total / rsf.total : 0;

    return {
      availableStableFunding: asf.total,
      requiredStableFunding: rsf.total,
      nsfrRatio,
      isCompliant: nsfrRatio >= 1.0,
      details: {
        capitalASF: asf.capital,
        retailDepositsASF: asf.retailDeposits,
        wholesaleFundingASF: asf.wholesaleFunding,
        otherLiabilitiesASF: asf.otherLiabilities,
        level1AssetsRSF: rsf.level1Assets,
        level2aAssetsRSF: rsf.level2aAssets,
        level2bAssetsRSF: rsf.level2bAssets,
        loansRSF: rsf.loans,
        otherAssetsRSF: rsf.otherAssets
      }
    };
  }

  private calculateHQLA() {
    let level1 = 0;
    let level2a = 0;
    let level2b = 0;

    this.data.forEach(item => {
      if (!item.isHQLA) return;

      const unencumbered = item.outstandingBalance - item.encumberedAmount;
      const afterHaircut = unencumbered * (1 - item.haircut);

      if (item.hqlaLevel === 1) {
        level1 += afterHaircut;
      } else if (item.hqlaLevel === 2) {
        if (item.productCategory === 'securities' && item.assetClass === 'government') {
          level2a += afterHaircut * 0.85;
        } else {
          level2a += afterHaircut * 0.85;
        }
      } else if (item.hqlaLevel === 3) {
        level2b += afterHaircut * 0.50;
      }
    });

    const level2aCap = level1 * (2 / 3);
    const level2bCap = level1 * (15 / 85);

    level2a = Math.min(level2a, level2aCap);
    level2b = Math.min(level2b, level2bCap);

    return {
      level1,
      level2a,
      level2b,
      total: level1 + level2a + level2b
    };
  }

  private calculateCashOutflows() {
    let retailDeposits = 0;
    let wholesaleFunding = 0;
    let securedFunding = 0;
    let derivatives = 0;
    let otherContractual = 0;
    let otherContingent = 0;

    this.data.forEach(item => {
      if (item.projectedCashOutflow <= 0 && item.productCategory !== 'deposits') return;

      if (item.productCategory === 'deposits') {
        if (item.counterpartyType === 'retail') {
          const runoffRate = this.getRetailDepositRunoffRate(item);
          retailDeposits += item.outstandingBalance * runoffRate;
        } else if (item.counterpartyType === 'wholesale' || item.counterpartyType === 'financial_institution') {
          const runoffRate = this.getWholesaleRunoffRate(item);
          wholesaleFunding += item.outstandingBalance * runoffRate;
        }
      } else if (item.productCategory === 'secured_funding') {
        securedFunding += this.getSecuredFundingOutflow(item);
      } else if (item.productCategory === 'derivatives') {
        derivatives += item.projectedCashOutflow;
      } else if (item.maturityBucket === 'overnight' || item.maturityBucket === '2-7days' || item.maturityBucket === '8-30days') {
        otherContractual += item.projectedCashOutflow;
      } else if (item.productCategory === 'credit_facilities' || item.productCategory === 'liquidity_facilities') {
        otherContingent += item.outstandingBalance * 0.05;
      }
    });

    const total = retailDeposits + wholesaleFunding + securedFunding + derivatives + otherContractual + otherContingent;

    return {
      retailDeposits,
      wholesaleFunding,
      securedFunding,
      derivatives,
      otherContractual,
      otherContingent,
      total
    };
  }

  private calculateCashInflows() {
    let total = 0;

    this.data.forEach(item => {
      if (item.projectedCashInflow > 0) {
        if (item.productCategory === 'loans') {
          const maturityDays = this.getMaturityDays(item.maturityBucket);
          if (maturityDays <= 30) {
            total += item.projectedCashInflow * 0.50;
          }
        } else {
          total += item.projectedCashInflow;
        }
      }
    });

    return { total };
  }

  private calculateAvailableStableFunding() {
    let capital = 0;
    let retailDeposits = 0;
    let wholesaleFunding = 0;
    let otherLiabilities = 0;

    this.data.forEach(item => {
      if (item.productCategory === 'equity' || item.productCategory === 'capital') {
        capital += item.outstandingBalance * 1.0;
      } else if (item.productCategory === 'deposits' && item.counterpartyType === 'retail') {
        const asfFactor = item.availableStableFundingFactor || this.getRetailDepositASFFactor(item);
        retailDeposits += item.outstandingBalance * asfFactor;
      } else if (item.productCategory === 'deposits' && (item.counterpartyType === 'wholesale' || item.counterpartyType === 'financial_institution')) {
        const asfFactor = item.availableStableFundingFactor || this.getWholesaleASFFactor(item);
        wholesaleFunding += item.outstandingBalance * asfFactor;
      } else if (item.productCategory === 'other_liabilities') {
        const asfFactor = item.availableStableFundingFactor || 0.0;
        otherLiabilities += item.outstandingBalance * asfFactor;
      }
    });

    return {
      capital,
      retailDeposits,
      wholesaleFunding,
      otherLiabilities,
      total: capital + retailDeposits + wholesaleFunding + otherLiabilities
    };
  }

  private calculateRequiredStableFunding() {
    let level1Assets = 0;
    let level2aAssets = 0;
    let level2bAssets = 0;
    let loans = 0;
    let otherAssets = 0;

    this.data.forEach(item => {
      if (item.productCategory === 'deposits' || item.productCategory === 'capital' || item.productCategory === 'equity') {
        return;
      }

      const rsfFactor = item.requiredStableFundingFactor || this.getRSFFactor(item);
      const rsfAmount = item.outstandingBalance * rsfFactor;

      if (item.isHQLA && item.hqlaLevel === 1) {
        level1Assets += rsfAmount;
      } else if (item.isHQLA && item.hqlaLevel === 2) {
        level2aAssets += rsfAmount;
      } else if (item.isHQLA && item.hqlaLevel === 3) {
        level2bAssets += rsfAmount;
      } else if (item.productCategory === 'loans') {
        loans += rsfAmount;
      } else {
        otherAssets += rsfAmount;
      }
    });

    return {
      level1Assets,
      level2aAssets,
      level2bAssets,
      loans,
      otherAssets,
      total: level1Assets + level2aAssets + level2bAssets + loans + otherAssets
    };
  }

  private getRetailDepositRunoffRate(item: FR2052aLineItem): number {
    if (item.runoffRate) return item.runoffRate;

    if (item.subProduct === 'stable') return 0.03;
    if (item.subProduct === 'less_stable') return 0.10;

    return 0.10;
  }

  private getWholesaleRunoffRate(item: FR2052aLineItem): number {
    if (item.runoffRate) return item.runoffRate;

    if (item.subProduct === 'operational') return 0.25;
    if (item.counterpartyType === 'financial_institution') return 1.00;

    return 0.40;
  }

  private getSecuredFundingOutflow(item: FR2052aLineItem): number {
    if (item.isHQLA && item.hqlaLevel === 1) {
      return item.outstandingBalance * 0.0;
    }
    return item.outstandingBalance * 1.0;
  }

  private getRetailDepositASFFactor(item: FR2052aLineItem): number {
    if (item.subProduct === 'stable') return 0.95;
    if (item.subProduct === 'less_stable') return 0.90;
    return 0.90;
  }

  private getWholesaleASFFactor(item: FR2052aLineItem): number {
    if (item.subProduct === 'operational') return 0.50;

    const maturityDays = this.getMaturityDays(item.maturityBucket);
    if (maturityDays < 180) return 0.0;
    if (maturityDays < 365) return 0.50;
    return 1.00;
  }

  private getRSFFactor(item: FR2052aLineItem): number {
    if (item.isHQLA && item.hqlaLevel === 1) return 0.0;
    if (item.isHQLA && item.hqlaLevel === 2) return 0.15;
    if (item.isHQLA && item.hqlaLevel === 3) return 0.50;

    if (item.productCategory === 'loans') {
      if (item.counterpartyType === 'retail' && item.maturityBucket === 'gt_1year') {
        return 0.65;
      }
      return 0.85;
    }

    if (item.productCategory === 'securities') return 0.85;

    return 1.00;
  }

  private getMaturityDays(maturityBucket: string): number {
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
}
