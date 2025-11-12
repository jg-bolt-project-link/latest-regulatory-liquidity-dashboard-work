import { X, ExternalLink, FileText } from 'lucide-react';

interface RegulatoryReference {
  title: string;
  description: string;
  url: string;
  section?: string;
}

interface RegulatoryReferencesModalProps {
  metricName: string;
  onClose: () => void;
}

const regulatoryReferences: Record<string, RegulatoryReference[]> = {
  'Tier 1 Capital': [
    {
      title: 'Basel III: Finalising Post-Crisis Reforms',
      description: 'Defines Tier 1 capital composition, including Common Equity Tier 1 (CET1) and Additional Tier 1 capital components.',
      url: 'https://www.bis.org/bcbs/publ/d424.htm',
      section: 'Part 1: Minimum Capital Requirements'
    },
    {
      title: 'Federal Reserve - Capital Requirements',
      description: 'US implementation of Basel III capital standards, including minimum ratios and buffer requirements for banking organizations.',
      url: 'https://www.federalreserve.gov/supervisionreg/topics/capital.htm'
    },
    {
      title: '12 CFR Part 217 - Capital Adequacy',
      description: 'Federal regulation establishing minimum capital requirements for national banks and federal savings associations.',
      url: 'https://www.ecfr.gov/current/title-12/chapter-II/subchapter-A/part-217',
      section: 'Subpart B: Capital Ratio Requirements'
    }
  ],
  'Tier 1 Capital Ratio': [
    {
      title: 'Basel III: Finalising Post-Crisis Reforms',
      description: 'Minimum Tier 1 capital ratio requirement of 6% of risk-weighted assets.',
      url: 'https://www.bis.org/bcbs/publ/d424.htm',
      section: 'Part 1: Minimum Capital Requirements'
    },
    {
      title: 'Federal Reserve SR 15-18',
      description: 'Guidance on capital planning for Category I and II banking organizations.',
      url: 'https://www.federalreserve.gov/supervisionreg/srletters/sr1518.htm'
    }
  ],
  'Leverage Ratio': [
    {
      title: 'Basel III Leverage Ratio Framework',
      description: 'Minimum 3% leverage ratio requirement, with enhanced requirements for G-SIBs.',
      url: 'https://www.bis.org/bcbs/publ/d270.htm'
    },
    {
      title: 'Enhanced Supplementary Leverage Ratio (eSLR)',
      description: 'US G-SIBs must maintain a minimum 5% supplementary leverage ratio (3% base + 2% buffer).',
      url: 'https://www.federalreserve.gov/supervisionreg/topics/supplementary_leverage_ratio.htm'
    },
    {
      title: '12 CFR 217.10 - Minimum Capital Requirements',
      description: 'Federal regulation establishing leverage ratio requirements.',
      url: 'https://www.ecfr.gov/current/title-12/section-217.10'
    }
  ],
  'Liquidity Coverage Ratio (LCR)': [
    {
      title: 'Basel III: The Liquidity Coverage Ratio (BCBS 238)',
      description: 'Requires banks to hold sufficient high-quality liquid assets (HQLA) to cover 30 days of net cash outflows under stress.',
      url: 'https://www.bis.org/publ/bcbs238.htm'
    },
    {
      title: 'Federal Reserve LCR Rule',
      description: 'US implementation requiring minimum 100% LCR for covered banking organizations.',
      url: 'https://www.federalreserve.gov/supervisionreg/topics/liquidity_coverage_ratio.htm'
    },
    {
      title: '12 CFR Part 249 - Liquidity Risk Measurement',
      description: 'Federal regulation establishing LCR requirements and calculation methodology.',
      url: 'https://www.ecfr.gov/current/title-12/chapter-II/subchapter-A/part-249'
    }
  ],
  'Total High-Quality Liquid Assets (HQLA)': [
    {
      title: 'Basel III: The Liquidity Coverage Ratio (BCBS 238)',
      description: 'Defines HQLA composition: Level 1 (100%), Level 2A (85%), and Level 2B (50%) assets.',
      url: 'https://www.bis.org/publ/bcbs238.htm',
      section: 'Section II: HQLA Definition'
    },
    {
      title: '12 CFR 249.20 - HQLA Amount',
      description: 'US regulatory definition and calculation of high-quality liquid assets.',
      url: 'https://www.ecfr.gov/current/title-12/section-249.20'
    }
  ],
  'Total Net Cash Outflows (30-day)': [
    {
      title: 'Basel III: The Liquidity Coverage Ratio (BCBS 238)',
      description: 'Defines net cash outflow calculation methodology for 30-day stressed scenario.',
      url: 'https://www.bis.org/publ/bcbs238.htm',
      section: 'Section III: Net Cash Outflows'
    },
    {
      title: '12 CFR 249.30 - Total Net Cash Outflow Amount',
      description: 'US regulatory methodology for calculating stressed net cash outflows.',
      url: 'https://www.ecfr.gov/current/title-12/section-249.30'
    }
  ],
  'Net Stable Funding Ratio (NSFR)': [
    {
      title: 'Basel III: The Net Stable Funding Ratio (BCBS 295)',
      description: 'Requires minimum 100% ratio of available stable funding to required stable funding over one year.',
      url: 'https://www.bis.org/bcbs/publ/d295.htm'
    },
    {
      title: 'Federal Reserve NSFR Rule',
      description: 'US implementation of NSFR requirements for Category I-III banking organizations.',
      url: 'https://www.federalreserve.gov/supervisionreg/topics/net_stable_funding_ratio.htm'
    },
    {
      title: '12 CFR Part 329 - Net Stable Funding Ratio',
      description: 'Federal regulation establishing NSFR requirements and calculation standards.',
      url: 'https://www.ecfr.gov/current/title-12/chapter-III/subchapter-B/part-329'
    }
  ],
  'Available Stable Funding (ASF)': [
    {
      title: 'Basel III: The Net Stable Funding Ratio (BCBS 295)',
      description: 'Defines ASF factors for various funding sources (capital, deposits, long-term borrowings).',
      url: 'https://www.bis.org/bcbs/publ/d295.htm',
      section: 'Section II: Available Stable Funding'
    }
  ],
  'Required Stable Funding (RSF)': [
    {
      title: 'Basel III: The Net Stable Funding Ratio (BCBS 295)',
      description: 'Defines RSF factors for assets and off-balance sheet exposures.',
      url: 'https://www.bis.org/bcbs/publ/d295.htm',
      section: 'Section III: Required Stable Funding'
    }
  ],
  'Resolution Capital Adequacy Position (RCAP) Ratio': [
    {
      title: 'Federal Reserve - Resolution Planning',
      description: 'Requirements for resolution capital adequacy under Title I of Dodd-Frank Act.',
      url: 'https://www.federalreserve.gov/supervisionreg/resolution-plans.htm'
    },
    {
      title: 'Federal Reserve SR 19-7',
      description: 'Guidance on resolution planning for large banking organizations.',
      url: 'https://www.federalreserve.gov/supervisionreg/srletters/sr1907.htm'
    },
    {
      title: 'Dodd-Frank Act Section 165(d)',
      description: 'Requires resolution plans demonstrating rapid and orderly resolution.',
      url: 'https://www.govinfo.gov/content/pkg/PLAW-111publ203/html/PLAW-111publ203.htm',
      section: 'Section 165(d): Resolution Plans'
    }
  ],
  'Total Assets': [
    {
      title: 'FASB ASC 210 - Balance Sheet',
      description: 'US GAAP accounting standards for asset recognition and measurement.',
      url: 'https://www.fasb.org/standards'
    }
  ],
  'Total Liabilities': [
    {
      title: 'FASB ASC 210 - Balance Sheet',
      description: 'US GAAP accounting standards for liability recognition and measurement.',
      url: 'https://www.fasb.org/standards'
    }
  ],
  'Total Equity': [
    {
      title: 'FASB ASC 505 - Equity',
      description: 'US GAAP accounting standards for equity instruments and transactions.',
      url: 'https://www.fasb.org/standards'
    }
  ]
};

export function RegulatoryReferencesModal({
  metricName,
  onClose
}: RegulatoryReferencesModalProps) {
  const references = regulatoryReferences[metricName] || [
    {
      title: 'General Regulatory Framework',
      description: 'This metric is subject to various regulatory requirements. Please consult relevant Basel III standards and Federal Reserve guidance.',
      url: 'https://www.bis.org/bcbs/publ/d424.htm'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Regulatory References</h2>
              <p className="text-sm text-slate-600 mt-0.5">{metricName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {references.map((ref, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-lg p-5 border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">{ref.title}</h3>
                    {ref.section && (
                      <p className="text-xs font-medium text-blue-600 mb-2">{ref.section}</p>
                    )}
                    <p className="text-sm text-slate-700 mb-3">{ref.description}</p>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Regulatory Text</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <strong className="text-slate-900">Note:</strong> These references provide the regulatory context
              and requirements relevant to this metric. Always consult the most current regulatory guidance
              and work with compliance teams for interpretation and application.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
