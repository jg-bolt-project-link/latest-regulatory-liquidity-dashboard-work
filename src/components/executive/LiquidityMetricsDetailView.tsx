import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Droplets, AlertTriangle, CheckCircle, Activity, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { LegalEntityFilter } from '../shared/LegalEntityFilter';
import { MetricValueWithDetails } from '../shared/MetricValueWithDetails';

interface LCRMetric {
  id: string;
  report_date: string;
  lcr_ratio: number;
  total_hqla: number;
  total_net_cash_outflows: number;
  is_compliant: boolean;
}

interface NSFRMetric {
  id: string;
  report_date: string;
  nsfr_ratio: number;
  available_stable_funding: number;
  required_stable_funding: number;
  is_compliant: boolean;
}

interface StressTest {
  id: string;
  report_date: string;
  scenario_name: string;
  scenario_type: string;
  baseline_liquidity: number;
  stressed_liquidity: number;
  liquidity_shortfall: number;
  survival_days: number;
  stress_severity: string;
  passes_internal_threshold: boolean;
}

interface ResolutionLiquidityMetric {
  id: string;
  report_date: string;
  rlap_amount: number;
  rlap_ratio: number;
  rlap_requirement: number;
  rlap_surplus_deficit: number;
  rlen_amount: number;
  rlen_ratio: number;
  rlen_requirement: number;
  is_compliant: boolean;
}

interface LiquidityMetricsDetailViewProps {
  onNavigate?: (view: string) => void;
}

export function LiquidityMetricsDetailView({ onNavigate }: LiquidityMetricsDetailViewProps) {
  const { user } = useAuth();
  const [lcrMetrics, setLCRMetrics] = useState<LCRMetric[]>([]);
  const [nsfrMetrics, setNSFRMetrics] = useState<NSFRMetric[]>([]);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [resolutionLiquidity, setResolutionLiquidity] = useState<ResolutionLiquidityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lcr' | 'nsfr' | 'stress' | 'resolution'>('lcr');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [user, selectedEntityId]);

  const loadMetrics = async () => {
    if (!user) return;

    let lcrQuery = supabase.from('lcr_metrics').select('*').eq('user_id', user.id);
    let nsfrQuery = supabase.from('nsfr_metrics').select('*').eq('user_id', user.id);
    let stressQuery = supabase.from('liquidity_stress_tests').select('*').eq('user_id', user.id);
    let resolutionQuery = supabase.from('resolution_liquidity_metrics').select('*').eq('user_id', user.id);

    if (selectedEntityId) {
      lcrQuery = lcrQuery.eq('legal_entity_id', selectedEntityId);
      nsfrQuery = nsfrQuery.eq('legal_entity_id', selectedEntityId);
      stressQuery = stressQuery.eq('legal_entity_id', selectedEntityId);
      resolutionQuery = resolutionQuery.eq('legal_entity_id', selectedEntityId);
    }

    const [lcrResult, nsfrResult, stressResult, resolutionResult] = await Promise.all([
      lcrQuery.order('report_date', { ascending: false}).limit(10),
      nsfrQuery.order('report_date', { ascending: false}).limit(10),
      stressQuery.order('report_date', { ascending: false}).limit(10),
      resolutionQuery.order('report_date', { ascending: false}).limit(10)
    ]);

    if (lcrResult.data) setLCRMetrics(lcrResult.data);
    if (nsfrResult.data) setNSFRMetrics(nsfrResult.data);
    if (stressResult.data) setStressTests(stressResult.data);
    if (resolutionResult.data) setResolutionLiquidity(resolutionResult.data);
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

  const latestLCR = lcrMetrics[0];
  const latestNSFR = nsfrMetrics[0];
  const latestStress = stressTests[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Liquidity Coverage & Stress Testing</h1>
          <p className="text-sm text-slate-600">LCR, NSFR, resolution liquidity, and stress test analysis</p>
        </div>
        <div className="w-80">
          <LegalEntityFilter
            selectedEntityId={selectedEntityId}
            onEntityChange={setSelectedEntityId}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">About These Metrics</h3>
            <p className="text-sm text-slate-700 mb-4">
              The Liquidity Coverage Ratio (LCR) and Net Stable Funding Ratio (NSFR) are Basel III regulatory metrics designed to ensure banks maintain adequate liquidity.
              Resolution liquidity metrics (RLAP/RLEN) ensure adequate liquidity for orderly resolution. Stress testing evaluates liquidity resilience under adverse scenarios.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-slate-900 mb-1">Regulatory Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                  <li>LCR minimum requirement: 100% (HQLA must cover 30-day stressed net cash outflows)</li>
                  <li>NSFR minimum requirement: 100% (available stable funding must exceed required stable funding)</li>
                  <li>US G-SIBs face enhanced liquidity requirements and supervisory stress testing</li>
                  <li>Daily LCR reporting required for Category I and II banking organizations</li>
                  <li>RLAP (Resolution Liquidity Adequacy Position): Liquidity available in resolution</li>
                  <li>RLEN (Resolution Liquidity Execution Need): Liquidity needed for resolution execution</li>
                  <li>Internal stress testing must cover multiple scenarios including institution-specific and market-wide stresses</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="font-medium text-slate-900 mb-2">Regulatory Resources:</p>
                <div className="space-y-1">
                  <a
                    href="https://www.bis.org/publ/bcbs238.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Basel III: The Liquidity Coverage Ratio (BCBS 238)</span>
                  </a>
                  <a
                    href="https://www.bis.org/bcbs/publ/d295.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Basel III: The Net Stable Funding Ratio (BCBS 295)</span>
                  </a>
                  <a
                    href="https://www.federalreserve.gov/supervisionreg/topics/liquidity_coverage_ratio.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Federal Reserve - Liquidity Coverage Ratio Rule</span>
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
              <strong>Data Source:</strong> Representative sample data modeled on typical institutional liquidity metrics.
              While State Street Corporation publicly discloses LCR ratios in their <a
                href="https://investors.statestreet.com/financial-information/quarterly-results/default.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-700"
              >quarterly filings</a>, the detailed component breakdowns and stress test results shown here are representative data for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('lcr')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'lcr'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            LCR Metrics
          </button>
          <button
            onClick={() => setActiveTab('nsfr')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'nsfr'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            NSFR Metrics
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'stress'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Stress Tests
          </button>
          <button
            onClick={() => setActiveTab('resolution')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'resolution'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolution Liquidity
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading metrics...</div>
          </div>
        ) : (
          <>
            {activeTab === 'lcr' && (
              <div className="space-y-6">
                {latestLCR && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest LCR ({formatDate(latestLCR.report_date)})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">LCR Ratio</p>
                        <p className={`text-2xl font-bold ${latestLCR.lcr_ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(latestLCR.lcr_ratio)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {latestLCR.is_compliant ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-xs ${latestLCR.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                            {latestLCR.is_compliant ? 'Compliant' : 'Non-Compliant'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Minimum: 100%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total HQLA</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(latestLCR.total_hqla)}</p>
                        <p className="text-xs text-slate-500 mt-1">High-Quality Liquid Assets</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Net Cash Outflows (30d)</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(latestLCR.total_net_cash_outflows)}</p>
                        <p className="text-xs text-slate-500 mt-1">Stressed scenario</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">LCR Formula & Components</h3>
                  <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                    <p className="text-center text-lg mb-2">
                      <span className="font-mono font-semibold">LCR = (Total HQLA / Total Net Cash Outflows) × 100</span>
                    </p>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>• <strong>HQLA</strong>: Level 1 (100%) + Level 2A (85%) + Level 2B (50%)</p>
                      <p>• <strong>Net Cash Outflows</strong>: Expected outflows - Min(Expected inflows, 75% of outflows)</p>
                      <p>• <strong>Time Horizon</strong>: 30-day stressed scenario</p>
                      <p>• <strong>Minimum Requirement</strong>: 100% (Category II institutions)</p>
                    </div>
                  </div>

                  {latestLCR && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">HQLA Breakdown</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Level 1 (100%)</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestLCR.hqla_level_1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Level 2A (85%)</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestLCR.hqla_level_2a)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Level 2B (50%)</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestLCR.hqla_level_2b)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="text-slate-700 font-medium">Total HQLA</span>
                            <span className="font-bold text-blue-600">{formatCurrency(latestLCR.total_hqla)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">HQLA Level 1 Examples</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>• Central bank reserves</li>
                          <li>• US Treasury securities</li>
                          <li>• Cash</li>
                          <li>• Claims on sovereigns (0% risk weight)</li>
                        </ul>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">Net Cash Outflow Factors</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>• Retail deposits: 3-10% run-off</li>
                          <li>• Wholesale deposits: 25-100% run-off</li>
                          <li>• Secured funding: 0-100% run-off</li>
                          <li>• Committed facilities: 10-100% draw-down</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Historical LCR Trends</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">LCR Ratio</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">HQLA</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Net Outflows</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lcrMetrics.map((metric) => (
                          <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${metric.lcr_ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(metric.lcr_ratio)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.total_hqla)}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.total_net_cash_outflows)}</td>
                            <td className="py-3 px-4 text-center">
                              {metric.is_compliant ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'nsfr' && (
              <div className="space-y-6">
                {latestNSFR && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest NSFR ({formatDate(latestNSFR.report_date)})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">NSFR Ratio</p>
                        <p className={`text-2xl font-bold ${latestNSFR.nsfr_ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(latestNSFR.nsfr_ratio)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {latestNSFR.is_compliant ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-xs ${latestNSFR.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                            {latestNSFR.is_compliant ? 'Compliant' : 'Non-Compliant'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Minimum: 100%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Available Stable Funding</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(latestNSFR.available_stable_funding)}</p>
                        <p className="text-xs text-slate-500 mt-1">ASF</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Required Stable Funding</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(latestNSFR.required_stable_funding)}</p>
                        <p className="text-xs text-slate-500 mt-1">RSF</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">NSFR Formula & Components</h3>
                  <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                    <p className="text-center text-lg mb-2">
                      <span className="font-mono font-semibold">NSFR = (Available Stable Funding / Required Stable Funding) × 100</span>
                    </p>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>• <strong>ASF</strong>: Stable funding from capital, deposits, and long-term borrowings</p>
                      <p>• <strong>RSF</strong>: Stability of assets and off-balance sheet exposures</p>
                      <p>• <strong>Time Horizon</strong>: One year stressed scenario</p>
                      <p>• <strong>Minimum Requirement</strong>: 100% (Category II institutions)</p>
                    </div>
                  </div>

                  {latestNSFR && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">ASF Breakdown</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Retail Deposits</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestNSFR.retail_deposits)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Wholesale Funding</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestNSFR.wholesale_funding)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="text-slate-700 font-medium">Total ASF</span>
                            <span className="font-bold text-blue-600">{formatCurrency(latestNSFR.available_stable_funding)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">ASF Factors</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>• Capital: 100%</li>
                          <li>• Stable retail deposits: 95%</li>
                          <li>• Less stable retail deposits: 90%</li>
                          <li>• Wholesale deposits: 50%</li>
                          <li>• Operational deposits: 50%</li>
                        </ul>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">RSF Factors</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>• Cash and HQLA Level 1: 0%</li>
                          <li>• HQLA Level 2A: 15%</li>
                          <li>• HQLA Level 2B: 50%</li>
                          <li>• Loans to financial institutions: 85%</li>
                          <li>• Retail/SME loans: 85%</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Historical NSFR Trends</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">NSFR Ratio</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">ASF</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RSF</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nsfrMetrics.map((metric) => (
                          <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${metric.nsfr_ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(metric.nsfr_ratio)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.available_stable_funding)}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.required_stable_funding)}</td>
                            <td className="py-3 px-4 text-center">
                              {metric.is_compliant ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stress' && (
              <div className="space-y-6">
                {latestStress && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Latest Stress Test: {latestStress.scenario_name} ({formatDate(latestStress.report_date)})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Baseline Liquidity</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(latestStress.baseline_liquidity)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Stressed Liquidity</p>
                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(latestStress.stressed_liquidity)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Liquidity Shortfall</p>
                        <p className={`text-2xl font-bold ${latestStress.liquidity_shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(latestStress.liquidity_shortfall))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Survival Days</p>
                        <p className={`text-2xl font-bold ${latestStress.survival_days >= 30 ? 'text-green-600' : 'text-red-600'}`}>
                          {latestStress.survival_days}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {latestStress.passes_internal_threshold ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-xs ${latestStress.passes_internal_threshold ? 'text-green-600' : 'text-red-600'}`}>
                            {latestStress.passes_internal_threshold ? 'Passes' : 'Fails'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Stress Test History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Scenario</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Baseline</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Stressed</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Shortfall</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Days</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stressTests.map((test) => (
                          <tr key={test.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{formatDate(test.report_date)}</td>
                            <td className="py-3 px-4 text-sm text-slate-900">{test.scenario_name}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(test.baseline_liquidity)}</td>
                            <td className="py-3 px-4 text-sm text-right text-amber-600">{formatCurrency(test.stressed_liquidity)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${test.liquidity_shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(Math.abs(test.liquidity_shortfall))}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${test.survival_days >= 30 ? 'text-green-600' : 'text-red-600'}`}>
                              {test.survival_days}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {test.passes_internal_threshold ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resolution' && (
              <div className="space-y-6">
                {resolutionLiquidity[0] && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Resolution Liquidity Metrics ({formatDate(resolutionLiquidity[0].report_date)})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`rounded-xl p-6 border-2 ${
                        resolutionLiquidity[0].rlap_surplus_deficit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                      }`}>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-slate-600 mb-2">RLAP</h4>
                          <p className="text-xs text-slate-500">Resolution Liquidity Adequacy Position</p>
                        </div>
                        <div>
                          <p className={`text-3xl font-bold ${resolutionLiquidity[0].rlap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatPercent(resolutionLiquidity[0].rlap_ratio)}
                          </p>
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Amount</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(resolutionLiquidity[0].rlap_amount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Requirement</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(resolutionLiquidity[0].rlap_requirement)}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-2 border-t border-slate-300">
                              <span className="text-slate-700 font-medium">Surplus/Deficit</span>
                              <span className={`font-bold ${resolutionLiquidity[0].rlap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(resolutionLiquidity[0].rlap_surplus_deficit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl p-6 border-2 bg-blue-50 border-blue-300">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-slate-600 mb-2">RLEN</h4>
                          <p className="text-xs text-slate-500">Resolution Liquidity Execution Need</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-blue-700">{formatPercent(resolutionLiquidity[0].rlen_ratio)}</p>
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Amount Needed</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(resolutionLiquidity[0].rlen_amount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Requirement</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(resolutionLiquidity[0].rlen_requirement)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Resolution Liquidity Trends</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RLAP</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RLAP Surplus</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RLEN</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolutionLiquidity.map((metric) => (
                          <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.rlap_amount)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${metric.rlap_surplus_deficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(metric.rlap_surplus_deficit)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.rlen_amount)}</td>
                            <td className="py-3 px-4 text-center">
                              {metric.is_compliant ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
