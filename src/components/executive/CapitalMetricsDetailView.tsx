import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { LegalEntityFilter } from '../shared/LegalEntityFilter';

interface BalanceSheetMetric {
  id: string;
  report_date: string;
  tier1_capital: number;
  tier1_capital_ratio: number;
  total_risk_weighted_assets: number;
  leverage_ratio: number;
  total_assets: number;
  tier1_leverage_exposure: number;
}

interface ResolutionCapitalMetric {
  id: string;
  report_date: string;
  rcap_amount: number;
  rcap_ratio: number;
  rcap_requirement: number;
  rcap_surplus_deficit: number;
  rcen_amount: number;
  rcen_ratio: number;
  rcen_requirement: number;
  is_compliant: boolean;
}

interface CapitalMetricsDetailViewProps {
  onNavigate?: (view: string) => void;
}

export function CapitalMetricsDetailView({ onNavigate }: CapitalMetricsDetailViewProps) {
  const { user } = useAuth();
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetric[]>([]);
  const [resolutionCapitalMetrics, setResolutionCapitalMetrics] = useState<ResolutionCapitalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'regulatory' | 'internal' | 'resolution'>('regulatory');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [user, selectedEntityId]);

  const loadMetrics = async () => {
    if (!user) return;

    let bsQuery = supabase
      .from('balance_sheet_metrics')
      .select('*')
      .eq('user_id', user.id);

    let rcQuery = supabase
      .from('resolution_liquidity_metrics')
      .select('*')
      .eq('user_id', user.id);

    if (selectedEntityId) {
      bsQuery = bsQuery.eq('legal_entity_id', selectedEntityId);
      rcQuery = rcQuery.eq('legal_entity_id', selectedEntityId);
    }

    const [bsResult, rcResult] = await Promise.all([
      bsQuery.order('report_date', { ascending: false }).limit(10),
      rcQuery.order('report_date', { ascending: false }).limit(10)
    ]);

    if (bsResult.data) setBalanceSheetMetrics(bsResult.data);
    if (rcResult.data) setResolutionCapitalMetrics(rcResult.data);
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
  const latestRC = resolutionCapitalMetrics[0];

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
          <h1 className="text-2xl font-bold text-slate-900">Capital Adequacy & Requirements</h1>
          <p className="text-sm text-slate-600">Regulatory capital, internal targets, and resolution capital metrics</p>
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
              Capital metrics measure an institution's financial strength and ability to absorb losses. Regulatory capital ensures
              compliance with Basel III requirements, while resolution capital metrics (RCAP/RCEN) ensure adequate resources for orderly resolution.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-slate-900 mb-1">Key Capital Metrics:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                  <li><strong>Tier 1 Capital Ratio:</strong> Minimum 6% under Basel III (higher for G-SIBs with buffers)</li>
                  <li><strong>Leverage Ratio:</strong> Minimum 3% (5% for US G-SIBs)</li>
                  <li><strong>RCAP (Resolution Capital Adequacy Position):</strong> Capital available for recapitalization in resolution</li>
                  <li><strong>RCEN (Resolution Capital Execution Need):</strong> Capital needed to execute resolution strategy</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="font-medium text-slate-900 mb-2">Regulatory Resources:</p>
                <div className="space-y-1">
                  <a
                    href="https://www.bis.org/bcbs/publ/d424.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Basel III: Finalising Post-Crisis Reforms</span>
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
              <strong>Data Source:</strong> Regulatory capital ratios are based on State Street Corporation's <a
                href="https://investors.statestreet.com/financial-information/quarterly-results/default.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-700"
              >publicly disclosed quarterly reports</a>. Resolution capital metrics (RCAP/RCEN) are representative data for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('regulatory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'regulatory'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Regulatory Capital
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'internal'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Internal Targets
          </button>
          <button
            onClick={() => setActiveTab('resolution')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'resolution'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolution Capital (RCAP/RCEN)
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading capital metrics...</div>
          </div>
        ) : (
          <>
            {activeTab === 'regulatory' && latestBS && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Latest Regulatory Capital ({formatDate(latestBS.report_date)})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Tier 1 Capital</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(latestBS.tier1_capital)}</p>
                      <p className="text-xs text-slate-500 mt-1">Common equity + Additional Tier 1</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Tier 1 Capital Ratio</p>
                      <p className={`text-2xl font-bold ${latestBS.tier1_capital_ratio >= 0.06 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(latestBS.tier1_capital_ratio)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Minimum: 6.0% (Basel III)</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Leverage Ratio</p>
                      <p className={`text-2xl font-bold ${latestBS.leverage_ratio >= 0.05 ? 'text-green-600' : 'text-amber-600'}`}>
                        {formatPercent(latestBS.leverage_ratio)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">US G-SIB Minimum: 5.0%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Historical Trends</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Tier 1 Capital</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Tier 1 Ratio</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Leverage Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceSheetMetrics.map((metric) => (
                          <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.tier1_capital)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${metric.tier1_capital_ratio >= 0.06 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(metric.tier1_capital_ratio)}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${metric.leverage_ratio >= 0.05 ? 'text-green-600' : 'text-amber-600'}`}>
                              {formatPercent(metric.leverage_ratio)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'internal' && latestBS && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Internal Capital Targets</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    In addition to regulatory minimums, institutions maintain internal capital targets that exceed regulatory requirements
                    to provide buffers for stress scenarios and business growth.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Internal Tier 1 Target</p>
                      <p className="text-2xl font-bold text-blue-600">8.5%</p>
                      <p className="text-xs text-slate-500 mt-1">Current: {formatPercent(latestBS.tier1_capital_ratio)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Internal Leverage Target</p>
                      <p className="text-2xl font-bold text-blue-600">6.0%</p>
                      <p className="text-xs text-slate-500 mt-1">Current: {formatPercent(latestBS.leverage_ratio)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Capital Buffer Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Tier 1 Capital Buffer</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatPercent(latestBS.tier1_capital_ratio - 0.06)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${Math.min(((latestBS.tier1_capital_ratio - 0.06) / 0.04) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Above regulatory minimum of 6%</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Leverage Ratio Buffer</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatPercent(latestBS.leverage_ratio - 0.05)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${Math.min(((latestBS.leverage_ratio - 0.05) / 0.02) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Above G-SIB minimum of 5%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resolution' && latestRC && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Resolution Capital Metrics ({formatDate(latestRC.report_date)})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`rounded-xl p-6 border-2 ${
                      latestRC.rcap_surplus_deficit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                    }`}>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">RCAP</h4>
                        <p className="text-xs text-slate-500">Resolution Capital Adequacy Position</p>
                      </div>
                      <div>
                        <p className={`text-3xl font-bold ${latestRC.rcap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatPercent(latestRC.rcap_ratio)}
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Amount</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestRC.rcap_amount)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Requirement</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestRC.rcap_requirement)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-2 border-t border-slate-300">
                            <span className="text-slate-700 font-medium">Surplus/Deficit</span>
                            <span className={`font-bold ${latestRC.rcap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {formatCurrency(latestRC.rcap_surplus_deficit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-6 border-2 bg-blue-50 border-blue-300">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">RCEN</h4>
                        <p className="text-xs text-slate-500">Resolution Capital Execution Need</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-blue-700">{formatPercent(latestRC.rcen_ratio)}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Amount Needed</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestRC.rcen_amount)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Requirement</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(latestRC.rcen_requirement)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Resolution Capital Trends</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RCAP</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RCAP Surplus</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">RCEN</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolutionCapitalMetrics.map((metric) => (
                          <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.rcap_amount)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${metric.rcap_surplus_deficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(metric.rcap_surplus_deficit)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(metric.rcen_amount)}</td>
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
