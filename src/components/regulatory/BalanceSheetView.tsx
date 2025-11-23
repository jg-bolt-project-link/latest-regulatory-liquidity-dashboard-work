import { ArrowLeft, Building2, Info, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailModal } from './MetricDetailModal';
import { DataVisualization } from '../shared/DataVisualization';

interface BalanceSheetViewProps {
  onBack: () => void;
}

const TIER1_CAPITAL_METRIC = {
  name: 'Tier 1 Capital Ratio',
  code: 'Basel III Risk-Based Capital',
  description: 'The Tier 1 capital ratio measures a bank\'s core equity capital compared to its total risk-weighted assets (RWA). Category II institutions like State Street must maintain a minimum Tier 1 ratio of 8.0%.',
  formula: 'Tier 1 Capital Ratio = (Tier 1 Capital / Total Risk-Weighted Assets) × 100',
  regulatoryFramework: {
    regulation: '12 CFR Part 217 - Capital Adequacy',
    section: 'Subpart B - Capital Ratio Requirements',
    requirement: 'Category II banking organizations must maintain a Tier 1 capital ratio of at least 8.0%.',
    links: [
      { label: 'Federal Reserve Regulation Q', url: 'https://www.federalreserve.gov/supervisionreg/topics/capital.htm' },
      { label: 'Basel III Framework', url: 'https://www.bis.org/bcbs/publ/d424.htm' }
    ]
  },
  components: [
    {
      name: 'Tier 1 Capital',
      formula: 'Common Equity Tier 1 + Additional Tier 1 Capital',
      description: 'Tier 1 capital consists of common equity tier 1 (CET1) capital and additional tier 1 capital instruments.',
      regulatoryReference: '12 CFR §217.20',
      validationRules: [
        'CET1 must include common stock and retained earnings',
        'Regulatory deductions include goodwill and intangibles',
        'Additional Tier 1 may include non-cumulative perpetual preferred stock'
      ]
    }
  ],
  stateStreetExample: {
    period: 'Q3 2024',
    value: '13.8%',
    breakdown: [
      { label: 'Tier 1 Capital', amount: '$22.4B' },
      { label: 'Risk-Weighted Assets', amount: '$162.3B' }
    ]
  },
  validationRules: [
    'Tier 1 capital ratio must be ≥ 8.0% for Category II institutions',
    'CET1 ratio must be ≥ 7.0%'
  ],
  calculationSteps: [
    'Calculate Common Equity Tier 1 capital',
    'Add Additional Tier 1 instruments',
    'Compute risk-weighted assets',
    'Divide Tier 1 capital by RWA and multiply by 100'
  ]
};

export function BalanceSheetView({ onBack }: BalanceSheetViewProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Balance Sheet Metrics</h2>
          <p className="text-sm text-slate-600 mt-1">Capital Ratios & Asset Composition per Regulation YY</p>
        </div>
        <button
          onClick={() => setShowVisualization(true)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          title="Visualize Balance Sheet Data"
        >
          <BarChart3 className="w-4 h-4" />
          Visualize
        </button>
      </div>

      <button
        onClick={() => setShowDetailModal(true)}
        className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tier 1 Capital Ratio</p>
              <p className="text-xs text-slate-500">Click for detailed breakdown</p>
            </div>
          </div>
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-slate-900">13.8%</p>
        <p className="text-xs text-slate-500 mt-2">State Street Q3 2024 - Category II Minimum: 8.0%</p>
      </button>

      {showDetailModal && (
        <MetricDetailModal
          metric={TIER1_CAPITAL_METRIC}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Data Visualization Modal */}
      <DataVisualization
        isOpen={showVisualization}
        onClose={() => setShowVisualization(false)}
        title="Balance Sheet Metrics Visualization"
        data={[
          { category: 'Tier 1 Capital', value: 37800000000, type: 'Capital', ratio: 13.2 },
          { category: 'Total Assets', value: 326800000000, type: 'Assets', ratio: 0 },
          { category: 'Risk-Weighted Assets', value: 286400000000, type: 'Assets', ratio: 0 },
          { category: 'Common Equity Tier 1', value: 34200000000, type: 'Capital', ratio: 11.9 },
          { category: 'Total Equity', value: 32100000000, type: 'Capital', ratio: 0 },
          { category: 'Total Liabilities', value: 294700000000, type: 'Liabilities', ratio: 0 }
        ]}
        availableAttributes={[
          { name: 'category', label: 'Category', type: 'string' },
          { name: 'type', label: 'Type', type: 'string' },
          { name: 'value', label: 'Amount (USD)', type: 'number' },
          { name: 'ratio', label: 'Ratio (%)', type: 'number' }
        ]}
        defaultAggregateField="value"
      />
    </div>
  );
}
