import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Droplets, AlertTriangle, CheckCircle, X, Activity } from 'lucide-react';

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

export function LiquidityMetricsDetailView({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [lcrMetrics, setLCRMetrics] = useState<LCRMetric[]>([]);
  const [nsfrMetrics, setNSFRMetrics] = useState<NSFRMetric[]>([]);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lcr' | 'nsfr' | 'stress'>('lcr');

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;

    const [lcrResult, nsfrResult, stressResult] = await Promise.all([
      supabase
        .from('lcr_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false})
        .limit(10),
      supabase
        .from('nsfr_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(10),
      supabase
        .from('liquidity_stress_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(20)
    ]);

    console.log('Liquidity metrics loaded:', {
      lcr: lcrResult.data?.length,
      nsfr: nsfrResult.data?.length,
      stress: stressResult.data?.length
    });

    if (lcrResult.data) setLCRMetrics(lcrResult.data);
    if (nsfrResult.data) setNSFRMetrics(nsfrResult.data);
    if (stressResult.data) setStressTests(stressResult.data);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Loading liquidity metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Droplets className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Liquidity Metrics</h2>
                <p className="text-sm text-slate-600">LCR, NSFR, and Internal Stress Testing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('lcr')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'lcr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              LCR
            </button>
            <button
              onClick={() => setActiveTab('nsfr')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'nsfr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              NSFR
            </button>
            <button
              onClick={() => setActiveTab('stress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'stress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Stress Tests
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'lcr' && (
            <div className="space-y-6">
              {latestLCR && (
                <div className={`rounded-xl p-6 border-2 ${
                  latestLCR.is_compliant ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Latest LCR</h3>
                      <p className="text-sm text-slate-600">As of {formatDate(latestLCR.report_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-4xl font-bold ${latestLCR.is_compliant ? 'text-green-700' : 'text-red-700'}`}>
                        {formatPercent(latestLCR.lcr_ratio)}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">Minimum: 100%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total HQLA</p>
                      <p className="text-xl font-semibold text-slate-900">{formatCurrency(latestLCR.total_hqla)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Net Cash Outflows</p>
                      <p className="text-xl font-semibold text-slate-900">{formatCurrency(latestLCR.total_net_cash_outflows)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Historical LCR</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">LCR Ratio</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Total HQLA</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Net Cash Outflows</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lcrMetrics.map((metric) => (
                        <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(metric.report_date)}</td>
                          <td className={`px-6 py-4 text-right text-sm font-semibold ${metric.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(metric.lcr_ratio)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-900">{formatCurrency(metric.total_hqla)}</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-900">{formatCurrency(metric.total_net_cash_outflows)}</td>
                          <td className="px-6 py-4 text-center">
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
                <div className={`rounded-xl p-6 border-2 ${
                  latestNSFR.is_compliant ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Latest NSFR</h3>
                      <p className="text-sm text-slate-600">As of {formatDate(latestNSFR.report_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-4xl font-bold ${latestNSFR.is_compliant ? 'text-green-700' : 'text-red-700'}`}>
                        {formatPercent(latestNSFR.nsfr_ratio)}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">Minimum: 100%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Available Stable Funding</p>
                      <p className="text-xl font-semibold text-slate-900">{formatCurrency(latestNSFR.available_stable_funding)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Required Stable Funding</p>
                      <p className="text-xl font-semibold text-slate-900">{formatCurrency(latestNSFR.required_stable_funding)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Historical NSFR</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">NSFR Ratio</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Available SF</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Required SF</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {nsfrMetrics.map((metric) => (
                        <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(metric.report_date)}</td>
                          <td className={`px-6 py-4 text-right text-sm font-semibold ${metric.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(metric.nsfr_ratio)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-900">{formatCurrency(metric.available_stable_funding)}</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-900">{formatCurrency(metric.required_stable_funding)}</td>
                          <td className="px-6 py-4 text-center">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stressTests.filter(t => t.scenario_type === '30_day_short_term').slice(0, 2).map((test) => (
                  <div key={test.id} className={`rounded-xl p-6 border-2 ${
                    test.passes_internal_threshold ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">{test.scenario_name}</h4>
                        <p className="text-xs text-slate-600 mt-1">{formatDate(test.report_date)}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.stress_severity === 'Severe' ? 'bg-red-100 text-red-800' :
                        test.stress_severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {test.stress_severity}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Baseline Liquidity</span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(test.baseline_liquidity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Stressed Liquidity</span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(test.stressed_liquidity)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-300">
                        <span className="text-sm font-medium text-slate-700">Survival Period</span>
                        <span className="text-base font-bold text-slate-900">{test.survival_days} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">All Stress Test Results</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Scenario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Stressed Liquidity</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Survival</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stressTests.map((test) => (
                        <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(test.report_date)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{test.scenario_name}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {test.scenario_type === '30_day_short_term' ? '30-Day' : '1-Year'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(test.stressed_liquidity)}
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                            {test.survival_days} days
                          </td>
                          <td className="px-6 py-4 text-center">
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
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-xl">
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
