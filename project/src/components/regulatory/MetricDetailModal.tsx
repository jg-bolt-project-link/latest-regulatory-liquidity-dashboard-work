import { X, ExternalLink, BookOpen, Calculator, CheckCircle } from 'lucide-react';

interface MetricComponent {
  name: string;
  formula: string;
  description: string;
  regulatoryReference: string;
  validationRules: string[];
  examples?: string[];
}

interface MetricDetail {
  name: string;
  code: string;
  description: string;
  formula: string;
  regulatoryFramework: {
    regulation: string;
    section: string;
    requirement: string;
    links: { label: string; url: string }[];
  };
  components: MetricComponent[];
  stateStreetExample?: {
    period: string;
    value: string;
    breakdown: { label: string; amount: string }[];
  };
  validationRules: string[];
  calculationSteps: string[];
}

interface MetricDetailModalProps {
  metric: MetricDetail;
  onClose: () => void;
}

export function MetricDetailModal({ metric, onClose }: MetricDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{metric.name}</h2>
            <p className="text-sm text-slate-600 mt-1">{metric.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Overview</h3>
            <p className="text-slate-700 leading-relaxed">{metric.description}</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Primary Formula</h3>
            </div>
            <div className="bg-white rounded-lg p-4 font-mono text-sm border border-blue-200">
              {metric.formula}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Regulatory Framework</h3>
            </div>
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Regulation</p>
                  <p className="text-slate-900">{metric.regulatoryFramework.regulation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Section</p>
                  <p className="text-slate-900">{metric.regulatoryFramework.section}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Requirement</p>
                <p className="text-slate-700 leading-relaxed">{metric.regulatoryFramework.requirement}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-3">Official Sources</p>
                <div className="space-y-2">
                  {metric.regulatoryFramework.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Metric Components</h3>
            <div className="space-y-4">
              {metric.components.map((component, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5">
                  <h4 className="font-semibold text-slate-900 mb-2">{component.name}</h4>
                  <p className="text-sm text-slate-600 mb-3">{component.description}</p>

                  <div className="bg-slate-50 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-slate-600 mb-1">Formula</p>
                    <p className="font-mono text-sm text-slate-900">{component.formula}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-600 mb-2">Regulatory Reference</p>
                    <p className="text-sm text-slate-700">{component.regulatoryReference}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Validation Rules</p>
                    <ul className="space-y-1">
                      {component.validationRules.map((rule, ruleIdx) => (
                        <li key={ruleIdx} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {component.examples && component.examples.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-600 mb-2">Examples</p>
                      <ul className="space-y-1">
                        {component.examples.map((example, exIdx) => (
                          <li key={exIdx} className="text-sm text-slate-600">• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Calculation Steps</h3>
            <div className="bg-slate-50 rounded-lg p-6">
              <ol className="space-y-3">
                {metric.calculationSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Validation Rules</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <ul className="space-y-2">
                {metric.validationRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {metric.stateStreetExample && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                State Street Corporation Example
              </h3>
              <div className="bg-slate-800 text-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-300">Period: {metric.stateStreetExample.period}</p>
                  <p className="text-2xl font-bold">{metric.stateStreetExample.value}</p>
                </div>
                <div className="space-y-2 border-t border-slate-700 pt-4">
                  {metric.stateStreetExample.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-medium">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export const LCR_METRIC: MetricDetail = {
  name: 'Liquidity Coverage Ratio (LCR)',
  code: 'FR 2052a',
  description: 'The LCR requires banking organizations to maintain an adequate level of unencumbered high-quality liquid assets (HQLA) that can be converted into cash to meet liquidity needs for a 30-day time horizon under an acute liquidity stress scenario. Category II institutions like State Street must maintain a minimum LCR of 100%.',
  formula: 'LCR = (Total HQLA / Total Net Cash Outflows) × 100',
  regulatoryFramework: {
    regulation: '12 CFR Part 249 - Liquidity Coverage Ratio',
    section: 'Subpart A - General Provisions',
    requirement: 'Banking organizations with $250 billion or more in total consolidated assets or $10 billion or more in on-balance sheet foreign exposure (Category II) must maintain a liquidity coverage ratio of 100 percent or greater on each business day.',
    links: [
      { label: 'Federal Reserve Regulation WW - Liquidity Risk Measurement', url: 'https://www.federalreserve.gov/supervisionreg/basel-liquidity-coverage-ratio.htm' },
      { label: '12 CFR Part 249 - Full Text', url: 'https://www.ecfr.gov/current/title-12/chapter-II/subchapter-A/part-249' },
      { label: 'Basel III LCR Standard', url: 'https://www.bis.org/publ/bcbs238.htm' },
      { label: 'FR 2052a Reporting Instructions', url: 'https://www.federalreserve.gov/apps/reportforms/reportdetail.aspx?sOoYJ+5BzDal59CiASS8gg==' }
    ]
  },
  components: [
    {
      name: 'High-Quality Liquid Assets (HQLA)',
      formula: '(Level 1 × 100%) + (Level 2A × 85%) + (Level 2B × 50%)',
      description: 'HQLA consists of assets that can be easily and immediately converted into cash with little or no loss of value. Assets are categorized into levels with different haircuts applied.',
      regulatoryReference: '12 CFR §249.20 - HQLA Amount',
      validationRules: [
        'Level 2A assets cannot exceed 40% of total adjusted HQLA',
        'Level 2B assets cannot exceed 15% of total adjusted HQLA',
        'All assets must be unencumbered',
        'Assets must be under control of the treasury function',
        'Must exclude assets pledged to Federal Home Loan Banks'
      ],
      examples: [
        'Level 1: Cash, reserves at Federal Reserve, U.S. Treasury securities',
        'Level 2A: U.S. GSE debt, investment-grade corporate debt (20+ countries)',
        'Level 2B: Investment-grade corporate debt, publicly traded common stock (RMBS excluded for Category II)'
      ]
    },
    {
      name: 'Total Net Cash Outflows',
      formula: 'Max(Total Expected Cash Outflows - Min(Total Expected Cash Inflows, 75% × Outflows), 25% × Total Expected Cash Outflows)',
      description: 'Net cash outflows over a 30-day stress period, calculated as outflows minus capped inflows. The total must be at least 25% of gross outflows.',
      regulatoryReference: '12 CFR §249.30 - Total Net Cash Outflow Amount',
      validationRules: [
        'Inflows cannot exceed 75% of total outflows',
        'Minimum net outflow floor of 25% of gross outflows',
        'All outflows and inflows must use prescribed outflow/inflow rates',
        'Must include operational deposits and other committed facilities',
        'Derivative cash flows must be included on a net basis by counterparty'
      ],
      examples: [
        'Retail deposit outflow: Stable deposits (3%), Less stable (10%)',
        'Unsecured wholesale funding outflow: Operational (25%), Non-operational (100%)',
        'Secured funding outflow: Match-funded (0%), Other (100%)',
        'Additional requirements: Derivatives (100%), Committed credit facilities (10% retail, 40% corporate)'
      ]
    },
    {
      name: 'Expected Cash Outflows',
      formula: 'Σ(Outstanding Balance × Outflow Rate) for all liability categories',
      description: 'Expected cash outflows over the 30-day stress period based on contractual obligations and behavioral assumptions.',
      regulatoryReference: '12 CFR §249.32 - Outflow Amounts',
      validationRules: [
        'Must use regulatory prescribed outflow rates by funding category',
        'Retail deposits: Differentiate between stable (3%) and less stable (10%)',
        'Wholesale funding: Operational (25%), Non-operational (100%)',
        'Secured funding: 0% if match-funded to 30 days, 100% otherwise',
        'Off-balance sheet: Committed credit facilities (10% retail, 40% non-retail)'
      ]
    },
    {
      name: 'Expected Cash Inflows',
      formula: 'Σ(Outstanding Amount × Inflow Rate) for all contractual receivables',
      description: 'Expected cash inflows from contractual obligations owed to the institution. Capped at 75% of total outflows.',
      regulatoryReference: '12 CFR §249.33 - Inflow Amounts',
      validationRules: [
        'Total inflows capped at 75% of total outflows',
        'Retail inflows: 50% rate applied to retail performing exposures',
        'Wholesale inflows: 100% on contractual inflows maturing ≤30 days',
        'Cannot include renewal of existing credit facilities',
        'Securities maturing within 30 days receive 100% inflow treatment'
      ]
    }
  ],
  stateStreetExample: {
    period: 'Q3 2024 (September 30, 2024)',
    value: '112%',
    breakdown: [
      { label: 'Total HQLA', amount: '$59.2B' },
      { label: 'Level 1 HQLA', amount: '$54.8B' },
      { label: 'Level 2A HQLA', amount: '$5.2B' },
      { label: 'Total Net Cash Outflows (30-day)', amount: '$52.9B' },
      { label: 'LCR Ratio', amount: '112%' }
    ]
  },
  validationRules: [
    'LCR must be calculated on each business day',
    'Minimum LCR requirement: 100% for Category II institutions',
    'HQLA must be readily available to meet liquidity needs',
    'All cash flows must reflect contractual maturity dates',
    'Stress scenario assumptions must be consistently applied',
    'Must exclude assets pledged to central banks except when drawn',
    'Foreign currency HQLA and outflows must be tracked separately',
    'Operational deposits must meet criteria in 12 CFR §249.3'
  ],
  calculationSteps: [
    'Identify all qualifying HQLA assets by category (Level 1, 2A, 2B)',
    'Apply appropriate haircuts to Level 2A (15% haircut) and Level 2B (50% haircut)',
    'Verify Level 2 asset concentration limits (2A ≤ 40%, 2B ≤ 15%)',
    'Calculate total HQLA after haircuts and concentration limit adjustments',
    'Determine expected cash outflows for all liability categories using prescribed rates',
    'Calculate expected cash inflows from contractual receivables',
    'Apply 75% cap on inflows relative to total outflows',
    'Calculate net cash outflows: Outflows - Min(Inflows, 75% × Outflows)',
    'Apply 25% floor: Max(Net Outflows, 25% × Gross Outflows)',
    'Compute final LCR: (Total HQLA / Total Net Cash Outflows) × 100',
    'Verify LCR ≥ 100% for compliance'
  ]
};

export const NSFR_METRIC: MetricDetail = {
  name: 'Net Stable Funding Ratio (NSFR)',
  code: 'FR 2065',
  description: 'The NSFR is designed to ensure that banking organizations maintain a stable funding profile in relation to their assets and off-balance sheet activities. It requires a minimum amount of stable funding based on liquidity characteristics of assets and activities over a one-year time horizon.',
  formula: 'NSFR = (Available Stable Funding / Required Stable Funding) × 100',
  regulatoryFramework: {
    regulation: '12 CFR Part 329 - Net Stable Funding Ratio',
    section: 'Subpart A - General Provisions',
    requirement: 'Banking organizations with $100 billion or more in total consolidated assets (Category II and above) must maintain a net stable funding ratio of 100 percent or greater at all times.',
    links: [
      { label: 'Federal Reserve NSFR Rule', url: 'https://www.federalreserve.gov/newsevents/pressreleases/bcreg20201020a.htm' },
      { label: '12 CFR Part 329 - Full Text', url: 'https://www.ecfr.gov/current/title-12/chapter-III/subchapter-B/part-329' },
      { label: 'Basel III NSFR Standard', url: 'https://www.bis.org/bcbs/publ/d295.htm' },
      { label: 'FR 2065 Reporting Instructions', url: 'https://www.federalreserve.gov/apps/reportforms/reportdetail.aspx?sOoYJ+5BzDblQ7FZ9T8Vpw==' }
    ]
  },
  components: [
    {
      name: 'Available Stable Funding (ASF)',
      formula: 'Σ(Carrying Value of Liability or Capital × ASF Factor)',
      description: 'ASF represents the portion of capital and liabilities expected to be reliable over a one-year time horizon. Different funding sources receive different ASF factors based on stability.',
      regulatoryReference: '12 CFR §329.103 - ASF Amount',
      validationRules: [
        'Capital receives 100% ASF factor',
        'Retail deposits with maturity ≥1 year receive 95% factor',
        'Stable retail deposits <1 year receive 95% factor',
        'Less stable retail deposits <1 year receive 90% factor',
        'Wholesale funding with maturity ≥1 year from non-financial corporates receives 50% factor'
      ],
      examples: [
        'Tier 1 and Tier 2 Capital: 100% ASF',
        'Stable retail deposits <1 year: 95% ASF',
        'Less stable retail/small business deposits <1 year: 90% ASF',
        'Operational wholesale deposits: 50% ASF',
        'Non-operational wholesale deposits with maturity ≥1 year: 50% ASF',
        'All other liabilities and equity not included above: 0% ASF'
      ]
    },
    {
      name: 'Required Stable Funding (RSF)',
      formula: 'Σ(Carrying Value of Asset × RSF Factor) + Σ(Off-Balance Sheet Exposure × RSF Factor)',
      description: 'RSF represents the amount of stable funding required based on the liquidity characteristics of assets and off-balance sheet exposures. Less liquid assets require more stable funding.',
      regulatoryReference: '12 CFR §329.105 - RSF Amount',
      validationRules: [
        'Cash and reserves at Federal Reserve: 0% RSF',
        'Level 1 HQLA: 0% RSF (except Fed Reserve balances drawn on committed credit line: 85%)',
        'Level 2A HQLA: 15% RSF',
        'Level 2B HQLA: 50% RSF',
        'Performing loans to financial institutions with maturity <1 year: 15% RSF',
        'Performing residential mortgages: 65% RSF',
        'All other performing loans: 85% RSF',
        'Non-performing loans: 100% RSF'
      ],
      examples: [
        'Cash, reserves at Fed: 0% RSF',
        'U.S. Treasury securities: 0% RSF (5% if maturity ≥1 year)',
        'Level 2A HQLA: 15% RSF',
        'Performing interbank loans <1 year: 15% RSF',
        'Performing corporate loans: 85% RSF',
        'Non-performing assets: 100% RSF',
        'Undrawn committed credit facilities to non-financial corporates: 5% RSF'
      ]
    },
    {
      name: 'Retail Deposits and Funding',
      formula: '(Stable Retail Deposits × 95%) + (Less Stable Retail Deposits × 90%)',
      description: 'Retail deposits are deposits from natural persons or small business customers. Stability is determined by deposit insurance coverage and customer relationship strength.',
      regulatoryReference: '12 CFR §329.3 - Definitions of Retail Deposits',
      validationRules: [
        'Stable deposits must be fully insured and part of established relationship',
        'Brokered deposits are excluded from stable category',
        'Internet-only deposits considered less stable',
        'Multiple account relationships increase stability classification',
        'Transaction account relationships enhance stability assessment'
      ]
    },
    {
      name: 'Wholesale Funding',
      formula: 'Σ(Operational Deposits × 50%) + Σ(Other Wholesale <1yr × 0%) + Σ(Wholesale ≥1yr × 50%)',
      description: 'Wholesale funding from non-retail counterparties. Operational deposits receive preferential treatment due to stability of operational banking relationships.',
      regulatoryReference: '12 CFR §329.3 - Operational Deposits Definition',
      validationRules: [
        'Operational deposits must meet clearing, custody, or cash management criteria',
        'Substantially all payments must clear through institution daily',
        'Customer must have established operational relationship',
        'Cannot include deposits for investment purposes',
        'Non-operational wholesale <1 year receives 0% ASF'
      ]
    }
  ],
  stateStreetExample: {
    period: 'Q3 2024 (September 30, 2024)',
    value: '124%',
    breakdown: [
      { label: 'Available Stable Funding (ASF)', amount: '$198.5B' },
      { label: 'Equity and Long-term Debt', amount: '$32.8B' },
      { label: 'Stable Deposits', amount: '$154.2B' },
      { label: 'Required Stable Funding (RSF)', amount: '$160.1B' },
      { label: 'NSFR Ratio', amount: '124%' }
    ]
  },
  validationRules: [
    'NSFR must be calculated and maintained at all times',
    'Minimum NSFR requirement: 100% for institutions ≥$100B assets',
    'Must aggregate ASF and RSF across all entities in consolidated group',
    'Foreign currency ASF and RSF calculated separately but aggregated for ratio',
    'Interdependent assets and liabilities receive special treatment',
    'Must exclude minority interest not available to parent',
    'Derivative assets and liabilities calculated on net basis per counterparty'
  ],
  calculationSteps: [
    'Calculate total capital (Tier 1 + Tier 2) and assign 100% ASF factor',
    'Classify retail deposits as stable or less stable based on criteria',
    'Apply 95% ASF to stable deposits, 90% to less stable deposits',
    'Identify operational wholesale deposits and apply 50% ASF factor',
    'Assign ASF factors to all other liabilities based on maturity and type',
    'Sum all weighted liabilities and capital to get total ASF',
    'Classify all assets by type and assign appropriate RSF factors (0%-100%)',
    'Calculate RSF for off-balance sheet exposures (undrawn commitments, etc.)',
    'Sum all weighted assets and off-balance sheet items to get total RSF',
    'Compute final NSFR: (Total ASF / Total RSF) × 100',
    'Verify NSFR ≥ 100% for compliance'
  ]
};
