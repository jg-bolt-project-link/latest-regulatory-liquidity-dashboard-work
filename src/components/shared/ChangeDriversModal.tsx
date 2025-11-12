import { X, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ChangeDriversModalProps {
  metricName: string;
  currentValue: string | number;
  priorValue?: string | number;
  onClose: () => void;
}

const changeDriversData: Record<string, {
  delta: string;
  trend: 'up' | 'down' | 'stable';
  drivers: string[];
}> = {
  'Tier 1 Capital': {
    delta: '+$2.3B (+3.2%)',
    trend: 'up',
    drivers: [
      'Retained earnings increased by $1.8B due to strong quarterly net income, driven by higher net interest income and improved fee-based revenue from asset servicing',
      'Common stock issuance of $800M through employee compensation programs and dividend reinvestment plans',
      'Regulatory deductions decreased by $300M following the phase-out of certain goodwill and intangible assets under Basel III transition rules'
    ]
  },
  'Tier 1 Capital Ratio': {
    delta: '+0.45% (from 13.2% to 13.65%)',
    trend: 'up',
    drivers: [
      'Tier 1 capital increased by $2.3B (3.2%) while risk-weighted assets grew by only $1.1B (0.8%), resulting in improved capital efficiency',
      'Risk-weighted asset optimization through strategic balance sheet management, including reduction in lower-yielding, higher-risk-weight corporate loans',
      'Migration of certain exposures to lower risk-weight categories following credit rating upgrades of investment-grade counterparties'
    ]
  },
  'Leverage Ratio': {
    delta: '+0.12% (from 6.8% to 6.92%)',
    trend: 'up',
    drivers: [
      'Tier 1 capital growth of $2.3B outpaced total leverage exposure growth of $8.5B (2.1%), improving the ratio',
      'Strategic reduction in repo financing activities and optimization of securities financing transactions, reducing leverage exposure',
      'Enhanced capital planning and stress testing results demonstrating capacity to support higher leverage ratio buffers'
    ]
  },
  'Liquidity Coverage Ratio (LCR)': {
    delta: '+3.2% (from 118% to 121.2%)',
    trend: 'up',
    drivers: [
      'High-Quality Liquid Assets (HQLA) increased by $5.2B through strategic accumulation of Level 1 assets, including central bank reserves and U.S. Treasury securities',
      'Net cash outflows declined by $1.8B due to reduced reliance on less stable wholesale funding sources and increased proportion of operational deposits',
      'Improved deposit mix with higher proportion of retail and small business deposits qualifying for lower outflow rates under LCR rules'
    ]
  },
  'Total High-Quality Liquid Assets (HQLA)': {
    delta: '+$5.2B (+4.8%)',
    trend: 'up',
    drivers: [
      'Increased holdings of U.S. Treasury securities by $3.5B as part of proactive liquidity management and HQLA optimization strategy',
      'Growth in central bank reserve deposits by $1.2B following strong deposit inflows and reduced loan demand',
      'Acquisition of $500M in highly-rated sovereign bonds qualifying as Level 1 HQLA, enhancing liquidity buffer diversification'
    ]
  },
  'Total Net Cash Outflows (30-day)': {
    delta: '-$1.8B (-3.9%)',
    trend: 'down',
    drivers: [
      'Deposit base stabilization with 8% increase in retail deposits subject to lower stress outflow assumptions (5-10% vs. 25-40% for wholesale)',
      'Extension of wholesale funding maturity profile, with $2.1B of short-term funding rolled into tenors beyond 30 days',
      'Reduced reliance on secured funding through securities lending and repo transactions, lowering expected collateral calls in stress scenarios'
    ]
  },
  'Net Stable Funding Ratio (NSFR)': {
    delta: '+2.1% (from 115% to 117.1%)',
    trend: 'up',
    drivers: [
      'Available Stable Funding (ASF) increased by $4.7B through issuance of $3.2B in long-term debt and growth in stable deposit balances',
      'Required Stable Funding (RSF) decreased by $1.8B due to portfolio rebalancing toward more liquid, lower RSF-weighted assets',
      'Maturity extension of derivative liabilities reduced RSF requirements by optimizing the funding stability profile'
    ]
  },
  'Available Stable Funding (ASF)': {
    delta: '+$4.7B (+3.2%)',
    trend: 'up',
    drivers: [
      'Long-term debt issuance of $3.2B in senior unsecured notes with maturities beyond one year, providing 100% ASF factor',
      'Core retail and small business deposits grew by $2.8B, qualifying for 95% ASF factors due to stable funding characteristics',
      'Growth in equity by $1.5B through retained earnings, offsetting partial reduction from less stable wholesale deposits'
    ]
  },
  'Required Stable Funding (RSF)': {
    delta: '-$1.8B (-1.4%)',
    trend: 'down',
    drivers: [
      'Portfolio rebalancing with $2.5B shift from less liquid corporate loans (85% RSF) to Level 1 HQLA securities (5% RSF)',
      'Maturity profile optimization of securities portfolio, reducing weighted average maturity and associated RSF requirements',
      'Derivative asset reduction of $800M following netting arrangement enhancements and trade compression initiatives'
    ]
  },
  'Resolution Capital Adequacy Position (RCAP) Ratio': {
    delta: '+1.8% (from 125% to 126.8%)',
    trend: 'up',
    drivers: [
      'RCAP numerator increased by $2.1B through issuance of long-term debt instruments eligible for resolution recapitalization',
      'Pre-positioned capital buffers enhanced through improved internal loss-absorbing capacity planning and stress testing',
      'RCEN (Resolution Capital Execution Need) remained stable while capital position improved, demonstrating enhanced resolvability'
    ]
  },
  'Total Assets': {
    delta: '+$12.5B (+4.2%)',
    trend: 'up',
    drivers: [
      'Strong deposit growth of $8.3B drove corresponding increase in liquid asset holdings, particularly central bank reserves and securities',
      'Loan portfolio expansion of $4.8B concentrated in secured lending to financial institutions and trade finance activities',
      'Investment securities portfolio increased by $3.5B through strategic allocation to high-quality sovereign and agency securities'
    ]
  },
  'Total Liabilities': {
    delta: '+$10.2B (+4.0%)',
    trend: 'up',
    drivers: [
      'Customer deposit growth of $8.3B driven by corporate treasury services and institutional asset servicing businesses',
      'Long-term debt issuance of $3.2B to support TLAC (Total Loss-Absorbing Capacity) and NSFR regulatory requirements',
      'Short-term borrowings decreased by $1.5B as deposit funding displaced higher-cost wholesale funding sources'
    ]
  },
  'Total Equity': {
    delta: '+$2.3B (+5.1%)',
    trend: 'up',
    drivers: [
      'Net income of $2.1B for the quarter, primarily from asset servicing fees, securities lending revenue, and net interest income',
      'Common stock issuance of $800M through employee stock compensation and dividend reinvestment programs',
      'Accumulated other comprehensive income decreased by $600M due to unrealized losses on available-for-sale securities from rising rates'
    ]
  }
};

export function ChangeDriversModal({
  metricName,
  currentValue,
  priorValue,
  onClose
}: ChangeDriversModalProps) {
  const driverInfo = changeDriversData[metricName] || {
    delta: 'Data not available',
    trend: 'stable' as const,
    drivers: [
      'Prior period comparison data is currently being collected and will be available in the next reporting cycle',
      'Historical analysis requires at least two consecutive reporting periods to identify meaningful trends and drivers',
      'Contact the Data Quality team for historical data requests and custom period-over-period analysis'
    ]
  };

  const TrendIcon = driverInfo.trend === 'up' ? TrendingUp : driverInfo.trend === 'down' ? TrendingDown : Activity;
  const trendColor = driverInfo.trend === 'up' ? 'text-green-600' : driverInfo.trend === 'down' ? 'text-red-600' : 'text-slate-600';
  const trendBg = driverInfo.trend === 'up' ? 'bg-green-50' : driverInfo.trend === 'down' ? 'bg-red-50' : 'bg-slate-50';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${trendBg} rounded-lg`}>
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Change Analysis</h2>
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
          <div className="mb-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Current Value</span>
                <span className="text-lg font-bold text-slate-900">{currentValue}</span>
              </div>
              {priorValue && (
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                  <span className="text-sm font-medium text-slate-600">Prior Period</span>
                  <span className="text-lg font-semibold text-slate-700">{priorValue}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Change</span>
                <span className={`text-lg font-bold flex items-center gap-2 ${trendColor}`}>
                  <TrendIcon className="w-5 h-5" />
                  {driverInfo.delta}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Key Drivers of Change</h3>
            <div className="space-y-3">
              {driverInfo.drivers.map((driver, index) => (
                <div
                  key={index}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-700 flex-1">{driver}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <strong className="text-slate-900">Analysis Period:</strong> This analysis compares the current period
              to the immediate prior reporting period. Drivers identified represent the primary quantitative and
              qualitative factors contributing to the observed change based on internal management analysis and
              regulatory reporting data.
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
