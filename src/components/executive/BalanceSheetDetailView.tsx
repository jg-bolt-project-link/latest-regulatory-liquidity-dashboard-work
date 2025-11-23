import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, TrendingDown, Activity, ExternalLink, Info, X, FileDown } from 'lucide-react';
import { LegalEntityFilter } from '../shared/LegalEntityFilter';
import { MetricValueWithDetails } from '../shared/MetricValueWithDetails';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { exportBalanceSheetToPPT } from '../../utils/exportToPowerPoint';
import { DataVisualization } from '../shared/DataVisualization';

interface BalanceSheetMetric {
  id: string;
  report_date: string;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  cash_and_due_from_banks: number;
  securities_available_for_sale: number;
  loans_gross: number;
  deposits_total: number;
  tier1_capital: number;
  tier1_capital_ratio: number;
  leverage_ratio: number;
}

interface IRRBBMetric {
  id: string;
  report_date: string;
  scenario_type: string;
  eve_change_amount: number;
  eve_change_percent: number;
  nii_change_amount: number;
  nii_change_percent: number;
  duration_gap: number;
}

interface BalanceSheetDetailViewProps {
  onNavigate?: (view: string) => void;
}

export function BalanceSheetDetailView({ onNavigate }: BalanceSheetDetailViewProps) {
  const { user } = useAuth();
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetric[]>([]);
  const [irrbbMetrics, setIRRBBMetrics] = useState<IRRBBMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [selectedEntityId]);

  const loadMetrics = async () => {
    let bsQuery = supabase
      .from('balance_sheet_metrics')
      .select('*')
      .is('user_id', null);

    let irrbbQuery = supabase
      .from('interest_rate_risk_metrics')
      .select('*')
      .is('user_id', null);

    if (selectedEntityId) {
      bsQuery = bsQuery.eq('legal_entity_id', selectedEntityId);
      irrbbQuery = irrbbQuery.eq('legal_entity_id', selectedEntityId);
    }

    const [bsResult, irrbbResult] = await Promise.all([
      bsQuery.order('report_date', { ascending: false }).limit(10),
      irrbbQuery.order('report_date', { ascending: false }).limit(10)
    ]);

    if (bsResult.data) setBalanceSheetMetrics(bsResult.data);
    if (irrbbResult.data) setIRRBBMetrics(irrbbResult.data);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const latestBS = balanceSheetMetrics[0];
  const latestIRRBB = irrbbMetrics[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-4">
        <Breadcrumbs
          items={[
            { label: 'Executive Dashboard', onClick: () => onNavigate?.('dashboard') },
            { label: 'Balance Sheet & Interest Rate Risk' }
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVisualization(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            title="Visualize Balance Sheet Data"
          >
            <BarChart3 className="w-4 h-4" />
            Visualize
          </button>
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Balance Sheet & Interest Rate Risk</h1>
          <p className="text-sm text-slate-600">Comprehensive balance sheet composition and IRRBB analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const priorBS = balanceSheetMetrics.length > 1 ? balanceSheetMetrics[1] : null;
              exportBalanceSheetToPPT({
                currentAssets: latestBS ? formatCurrency(latestBS.total_assets) : 'N/A',
                priorAssets: priorBS ? formatCurrency(priorBS.total_assets) : undefined,
                assetsDelta: priorBS ? `${((latestBS!.total_assets - priorBS.total_assets) / priorBS.total_assets * 100).toFixed(1)}%` : undefined,
                currentLiabilities: latestBS ? formatCurrency(latestBS.total_liabilities) : 'N/A',
                priorLiabilities: priorBS ? formatCurrency(priorBS.total_liabilities) : undefined,
                liabilitiesDelta: priorBS ? `${((latestBS!.total_liabilities - priorBS.total_liabilities) / priorBS.total_liabilities * 100).toFixed(1)}%` : undefined,
                currentEquity: latestBS ? formatCurrency(latestBS.total_equity) : 'N/A',
                priorEquity: priorBS ? formatCurrency(priorBS.total_equity) : undefined,
                equityDelta: priorBS ? `${((latestBS!.total_equity - priorBS.total_equity) / priorBS.total_equity * 100).toFixed(1)}%` : undefined,
                currentTier1Ratio: latestBS ? formatPercent(latestBS.tier1_capital_ratio) : 'N/A',
                priorTier1Ratio: priorBS ? formatPercent(priorBS.tier1_capital_ratio) : undefined,
                tier1RatioDelta: priorBS ? `${(latestBS!.tier1_capital_ratio - priorBS.tier1_capital_ratio).toFixed(2)}%` : undefined,
                currentLeverageRatio: latestBS ? formatPercent(latestBS.leverage_ratio) : 'N/A',
                priorLeverageRatio: priorBS ? formatPercent(priorBS.leverage_ratio) : undefined,
                leverageRatioDelta: priorBS ? `${(latestBS!.leverage_ratio - priorBS.leverage_ratio).toFixed(2)}%` : undefined,
                currentDate: latestBS ? formatDate(latestBS.report_date) : undefined,
                priorDate: priorBS ? formatDate(priorBS.report_date) : undefined,
                tier1Status: latestBS && latestBS.tier1_capital_ratio >= 6 ? 'compliant' : 'warning',
                leverageStatus: latestBS && latestBS.leverage_ratio >= 5 ? 'compliant' : 'warning'
              });
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!latestBS}
            title="Export to PowerPoint"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <div className="w-72">
            <LegalEntityFilter
              selectedEntityId={selectedEntityId}
              onEntityChange={setSelectedEntityId}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading metrics...</div>
        </div>
      ) : (
        <>
          {latestBS && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Balance Sheet ({formatDate(latestBS.report_date)})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Assets</p>
                  <MetricValueWithDetails
                    value={formatCurrency(latestBS.total_assets)}
                    metricName="Total Assets"
                    targetTable="balance_sheet_metrics"
                    targetColumn="total_assets"
                    dataSource="Analytics"
                    className="text-2xl font-bold text-slate-900"
                    currentDate={formatDate(latestBS.report_date)}
                    priorValue={balanceSheetMetrics.length > 1 ? formatCurrency(balanceSheetMetrics[1].total_assets) : undefined}
                    priorDate={balanceSheetMetrics.length > 1 ? formatDate(balanceSheetMetrics[1].report_date) : undefined}
                    availablePeriods={balanceSheetMetrics.map(m => ({ date: formatDate(m.report_date), value: formatCurrency(m.total_assets) }))}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Liabilities</p>
                  <MetricValueWithDetails
                    value={formatCurrency(latestBS.total_liabilities)}
                    metricName="Total Liabilities"
                    targetTable="balance_sheet_metrics"
                    targetColumn="total_liabilities"
                    dataSource="Analytics"
                    className="text-2xl font-bold text-slate-900"
                    currentDate={formatDate(latestBS.report_date)}
                    priorValue={balanceSheetMetrics.length > 1 ? formatCurrency(balanceSheetMetrics[1].total_liabilities) : undefined}
                    priorDate={balanceSheetMetrics.length > 1 ? formatDate(balanceSheetMetrics[1].report_date) : undefined}
                    availablePeriods={balanceSheetMetrics.map(m => ({ date: formatDate(m.report_date), value: formatCurrency(m.total_liabilities) }))}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Equity</p>
                  <MetricValueWithDetails
                    value={formatCurrency(latestBS.total_equity)}
                    metricName="Total Equity"
                    targetTable="balance_sheet_metrics"
                    targetColumn="total_equity"
                    dataSource="Analytics"
                    className="text-2xl font-bold text-green-600"
                    currentDate={formatDate(latestBS.report_date)}
                    priorValue={balanceSheetMetrics.length > 1 ? formatCurrency(balanceSheetMetrics[1].total_equity) : undefined}
                    priorDate={balanceSheetMetrics.length > 1 ? formatDate(balanceSheetMetrics[1].report_date) : undefined}
                    availablePeriods={balanceSheetMetrics.map(m => ({ date: formatDate(m.report_date), value: formatCurrency(m.total_equity) }))}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Tier 1 Capital</p>
                  <MetricValueWithDetails
                    value={formatCurrency(latestBS.tier1_capital)}
                    metricName="Tier 1 Capital"
                    targetTable="balance_sheet_metrics"
                    targetColumn="tier1_capital"
                    dataSource="Analytics"
                    className="text-2xl font-bold text-slate-900"
                    currentDate={formatDate(latestBS.report_date)}
                    priorValue={balanceSheetMetrics.length > 1 ? formatCurrency(balanceSheetMetrics[1].tier1_capital) : undefined}
                    priorDate={balanceSheetMetrics.length > 1 ? formatDate(balanceSheetMetrics[1].report_date) : undefined}
                    availablePeriods={balanceSheetMetrics.map(m => ({ date: formatDate(m.report_date), value: formatCurrency(m.tier1_capital) }))}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Tier 1 Capital Ratio</p>
                  <MetricValueWithDetails
                    value={formatPercent(latestBS.tier1_capital_ratio)}
                    metricName="Tier 1 Capital Ratio"
                    targetTable="balance_sheet_metrics"
                    targetColumn="tier1_capital_ratio"
                    dataSource="Analytics"
                    className={`text-2xl font-bold ${latestBS.tier1_capital_ratio >= 0.06 ? 'text-green-600' : 'text-red-600'}`}
                    currentDate={formatDate(latestBS.report_date)}
                    priorValue={balanceSheetMetrics.length > 1 ? formatPercent(balanceSheetMetrics[1].tier1_capital_ratio) : undefined}
                    priorDate={balanceSheetMetrics.length > 1 ? formatDate(balanceSheetMetrics[1].report_date) : undefined}
                    availablePeriods={balanceSheetMetrics.map(m => ({ date: formatDate(m.report_date), value: formatPercent(m.tier1_capital_ratio) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum: 6%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Leverage Ratio</p>
                  <MetricValueWithDetails
                    value={formatPercent(latestBS.leverage_ratio)}
                    metricName="Leverage Ratio"
                    targetTable="balance_sheet_metrics"
                    targetColumn="leverage_ratio"
                    dataSource="Analytics"
                    className={`text-2xl font-bold ${latestBS.leverage_ratio >= 0.05 ? 'text-green-600' : 'text-amber-600'}`}
                    currentDate={formatDate(latestBS.report_date)}
                    priorValue={balanceSheetMetrics.length > 1 ? formatPercent(balanceSheetMetrics[1].leverage_ratio) : undefined}
                    priorDate={balanceSheetMetrics.length > 1 ? formatDate(balanceSheetMetrics[1].report_date) : undefined}
                    availablePeriods={balanceSheetMetrics.map(m => ({ date: formatDate(m.report_date), value: formatPercent(m.leverage_ratio) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">US G-SIB Minimum: 5%</p>
                </div>
              </div>
            </div>
          )}

          {latestIRRBB && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Interest Rate Risk Scenario: {latestIRRBB.scenario_type}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">EVE Change</p>
                  <MetricValueWithDetails
                    value={formatPercent(latestIRRBB.eve_change_percent)}
                    metricName="Economic Value of Equity (EVE) Change"
                    targetTable="interest_rate_risk_metrics"
                    targetColumn="eve_change_percent"
                    dataSource="Analytics"
                    className={`text-2xl font-bold ${latestIRRBB.eve_change_percent < -0.15 ? 'text-red-600' : latestIRRBB.eve_change_percent < 0 ? 'text-amber-600' : 'text-green-600'}`}
                  />
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(latestIRRBB.eve_change_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">NII Change</p>
                  <MetricValueWithDetails
                    value={formatPercent(latestIRRBB.nii_change_percent)}
                    metricName="Net Interest Income (NII) Change"
                    targetTable="interest_rate_risk_metrics"
                    targetColumn="nii_change_percent"
                    dataSource="Analytics"
                    className={`text-2xl font-bold ${latestIRRBB.nii_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(latestIRRBB.nii_change_amount)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Historical Trends</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Assets</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Equity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Tier 1 Ratio</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Leverage Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetMetrics.map((metric) => (
                    <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.total_assets)}</td>
                      <td className="py-3 px-4 text-sm text-right text-green-600">{formatCurrency(metric.total_equity)}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-900">{formatPercent(metric.tier1_capital_ratio)}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-900">{formatPercent(metric.leverage_ratio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">About This Metric</h3>
            <p className="text-sm text-slate-700 mb-4">
              Balance sheet metrics provide a comprehensive view of an institution's financial position, assets, liabilities, and equity composition.
              Interest Rate Risk in the Banking Book (IRRBB) measures potential impacts on economic value of equity (EVE) and net interest income (NII) from interest rate changes.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-slate-900 mb-1">Regulatory Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                  <li>Basel III capital requirements: Tier 1 capital ratio minimum of 6%</li>
                  <li>Leverage ratio minimum of 3% (5% for US G-SIBs)</li>
                  <li>IRRBB standards require institutions to measure and control interest rate risk</li>
                  <li>Supervisory outlier test: EVE decline &gt; 15% of Tier 1 capital triggers enhanced monitoring</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="font-medium text-slate-900 mb-2">Regulatory Resources:</p>
                <div className="space-y-1">
                  <a
                    href="https://www.bis.org/bcbs/publ/d368.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Basel Committee - Interest Rate Risk in the Banking Book (IRRBB)</span>
                  </a>
                  <a
                    href="https://www.federalreserve.gov/supervisionreg/topics/capital.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Federal Reserve - Capital Requirements</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-900">
              <strong>Data Source:</strong> Representative sample data based on State Street Corporation's publicly available financial reports.
              Balance sheet figures are modeled on <a
                href="https://investors.statestreet.com/financial-information/quarterly-results/default.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-700"
              >Q3 2024 10-Q filing</a>.
              IRRBB metrics represent typical institutional risk sensitivities and are not sourced from actual State Street disclosures.
            </p>
          </div>
        </div>
      </div>

      {/* Data Visualization Modal */}
      <DataVisualization
        isOpen={showVisualization}
        onClose={() => setShowVisualization(false)}
        title="Balance Sheet Data Visualization"
        data={balanceSheetMetrics}
        availableAttributes={[
          { name: 'report_date', label: 'Report Date', type: 'date' },
          { name: 'total_assets', label: 'Total Assets', type: 'number' },
          { name: 'total_liabilities', label: 'Total Liabilities', type: 'number' },
          { name: 'total_equity', label: 'Total Equity', type: 'number' },
          { name: 'cash_and_due_from_banks', label: 'Cash & Due from Banks', type: 'number' },
          { name: 'securities_available_for_sale', label: 'Securities AFS', type: 'number' },
          { name: 'loans_gross', label: 'Loans (Gross)', type: 'number' },
          { name: 'deposits_total', label: 'Total Deposits', type: 'number' },
          { name: 'tier1_capital', label: 'Tier 1 Capital', type: 'number' },
          { name: 'tier1_capital_ratio', label: 'Tier 1 Capital Ratio (%)', type: 'number' },
          { name: 'leverage_ratio', label: 'Leverage Ratio (%)', type: 'number' }
        ]}
        defaultAggregateField="total_assets"
      />
      </div>
    </div>
  );
}

