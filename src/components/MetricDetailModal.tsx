import { X, Calculator, BookOpen, CheckCircle } from 'lucide-react';

interface MetricDetailModalProps {
  metric: string;
  value: number;
  onClose: () => void;
}

export function MetricDetailModal({ metric, value, onClose }: MetricDetailModalProps) {
  const getMetricInfo = () => {
    switch (metric) {
      case 'assets':
        return {
          title: 'Total Assets',
          description: 'Total Assets represents the sum of all resources owned by the entity that have economic value and can be converted to cash or used to generate revenue.',
          formula: 'Total Assets = Current Assets + Non-Current Assets',
          components: [
            {
              name: 'Current Assets',
              formula: 'Cash + Accounts Receivable + Inventory + Short-term Investments',
              description: 'Assets expected to be converted to cash or used within one year.',
              validation: ['Must include all checking and savings accounts', 'Include marketable securities', 'Exclude restricted cash unless available within 12 months']
            },
            {
              name: 'Non-Current Assets',
              formula: 'Property, Plant & Equipment + Intangibles + Long-term Investments',
              description: 'Assets held for more than one year, including fixed assets and long-term investments.',
              validation: ['Include investment portfolios held long-term', 'Property valued at fair market value or historical cost', 'Intangibles like goodwill if applicable']
            }
          ],
          calculation: [
            'Identify all liquid assets (checking, savings, money market accounts)',
            'Add short-term investments and marketable securities',
            'Sum current assets subtotal',
            'Add long-term investments and fixed assets',
            'Calculate total by summing current and non-current assets'
          ],
          interpretation: [
            'Higher total assets indicate greater financial capacity',
            'Asset composition matters - liquid vs illiquid',
            'Compare to liabilities to assess net worth',
            'Track trends over time to measure growth'
          ]
        };

      case 'liabilities':
        return {
          title: 'Total Liabilities',
          description: 'Total Liabilities represents all debts and financial obligations that the entity owes to external parties, including short-term and long-term obligations.',
          formula: 'Total Liabilities = Current Liabilities + Long-term Liabilities',
          components: [
            {
              name: 'Current Liabilities',
              formula: 'Accounts Payable + Short-term Debt + Accrued Expenses',
              description: 'Obligations due within one year, including credit cards and short-term borrowings.',
              validation: ['Include all credit card balances', 'Add lines of credit drawn amounts', 'Include current portion of long-term debt']
            },
            {
              name: 'Long-term Liabilities',
              formula: 'Long-term Debt + Bonds Payable + Lease Obligations',
              description: 'Obligations due beyond one year, such as mortgages and long-term loans.',
              validation: ['Exclude current portion already counted above', 'Include full principal amount of long-term loans', 'Add present value of lease obligations if applicable']
            }
          ],
          calculation: [
            'Sum all credit card balances and short-term credit lines',
            'Add any accrued expenses or accounts payable',
            'Calculate current liabilities subtotal',
            'Add long-term debt excluding current portion',
            'Sum all liability categories for total liabilities'
          ],
          interpretation: [
            'Lower liability ratios indicate less financial risk',
            'Compare to assets to calculate debt-to-asset ratio',
            'Monitor debt service coverage capacity',
            'Evaluate maturity profile of obligations'
          ]
        };

      case 'liquidity':
        return {
          title: 'Net Liquidity Position',
          description: 'Net Liquidity represents the difference between total assets and total liabilities, indicating the net financial position and ability to meet obligations while maintaining operational flexibility.',
          formula: 'Net Liquidity = Total Assets - Total Liabilities',
          components: [
            {
              name: 'Working Capital Component',
              formula: 'Current Assets - Current Liabilities',
              description: 'Short-term liquidity position measuring ability to meet near-term obligations.',
              validation: ['Ensure current assets exceed current liabilities for positive working capital', 'Monitor current ratio (Current Assets / Current Liabilities)', 'Target current ratio >1.5 for healthy liquidity']
            },
            {
              name: 'Net Worth Component',
              formula: 'Total Assets - Total Liabilities = Equity',
              description: 'Overall financial health and ownership value after satisfying all obligations.',
              validation: ['Positive net worth indicates solvency', 'Negative net worth signals financial distress', 'Growing net worth demonstrates value creation']
            }
          ],
          calculation: [
            'Calculate total assets from all account balances',
            'Sum total liabilities from all debt obligations',
            'Subtract liabilities from assets',
            'Positive result = surplus, Negative result = deficit',
            'Compare to previous periods to identify trends'
          ],
          interpretation: [
            'Positive net liquidity indicates financial strength and flexibility',
            'Negative net liquidity requires immediate attention and restructuring',
            'Ratio to assets shows leverage: Assets/Liabilities > 2.0 is conservative',
            'Maintain adequate liquidity buffer for unexpected events',
            'Consider liquidity ratios: Current Ratio, Quick Ratio, Cash Ratio'
          ]
        };

      default:
        return null;
    }
  };

  const info = getMetricInfo();
  if (!info) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{info.title}</h2>
            <p className="text-lg font-semibold text-blue-600 mt-1">{formatCurrency(value)}</p>
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
            <p className="text-slate-700 leading-relaxed">{info.description}</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Formula</h3>
            </div>
            <div className="bg-white rounded-lg p-4 font-mono text-sm border border-blue-200">
              {info.formula}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Components</h3>
            <div className="space-y-4">
              {info.components.map((component, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5">
                  <h4 className="font-semibold text-slate-900 mb-2">{component.name}</h4>
                  <p className="text-sm text-slate-600 mb-3">{component.description}</p>

                  <div className="bg-slate-50 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-slate-600 mb-1">Formula</p>
                    <p className="font-mono text-sm text-slate-900">{component.formula}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Validation Rules</p>
                    <ul className="space-y-1">
                      {component.validation.map((rule, ruleIdx) => (
                        <li key={ruleIdx} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Calculation Steps</h3>
            <div className="bg-slate-50 rounded-lg p-6">
              <ol className="space-y-3">
                {info.calculation.map((step, idx) => (
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
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Interpretation & Analysis</h3>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <ul className="space-y-2">
                {info.interpretation.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
