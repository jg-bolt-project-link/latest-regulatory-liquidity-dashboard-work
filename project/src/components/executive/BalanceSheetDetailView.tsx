import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, TrendingDown, Activity, X } from 'lucide-react';

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

export function BalanceSheetDetailView({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetric[]>([]);
  const [irrbbMetrics, setIRRBBMetrics] = useState<IRRBBMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;

    const [bsResult, irrbbResult] = await Promise.all([
      supabase
        .from('balance_sheet_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(10),
      supabase
        .from('interest_rate_risk_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(10)
    ]);

    console.log('Balance Sheet metrics loaded:', { bs: bsResult.data, irrbb: irrbbResult.data });

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Loading balance sheet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Balance Sheet & IRRBB</h2>
              <p className="text-sm text-slate-600">Comprehensive balance sheet and interest rate risk analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {latestBS && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Assets</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(latestBS.total_assets)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700">As of {formatDate(latestBS.report_date)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">Total Liabilities</p>
                      <p className="text-2xl font-bold text-red-900">{formatCurrency(latestBS.total_liabilities)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-red-700">As of {formatDate(latestBS.report_date)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Total Equity</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(latestBS.total_equity)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-700">As of {formatDate(latestBS.report_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Capital Ratios</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Tier 1 Capital Ratio</span>
                        <span className="text-lg font-bold text-slate-900">{formatPercent(latestBS.tier1_capital_ratio)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(latestBS.tier1_capital_ratio * 100 / 0.15, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Minimum: 8.0%</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Leverage Ratio</span>
                        <span className="text-lg font-bold text-slate-900">{formatPercent(latestBS.leverage_ratio)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(latestBS.leverage_ratio * 100 / 0.10, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Minimum: 5.0%</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Tier 1 Capital</span>
                        <span className="text-base font-semibold text-slate-900">{formatCurrency(latestBS.tier1_capital)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Balance Sheet Composition</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Cash & Due from Banks</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(latestBS.cash_and_due_from_banks)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Securities AFS</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(latestBS.securities_available_for_sale)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Loans (Gross)</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(latestBS.loans_gross)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Total Deposits</span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(latestBS.deposits_total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Interest Rate Risk in the Banking Book (IRRBB)</h3>
              <p className="text-sm text-slate-600 mt-1">Sensitivity analysis under various rate scenarios</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Scenario</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">EVE Change</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">EVE %</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">NII Change</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">NII %</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Duration Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {irrbbMetrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(metric.report_date)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {metric.scenario_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${metric.eve_change_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metric.eve_change_amount)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${metric.eve_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(metric.eve_change_percent)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${metric.nii_change_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metric.nii_change_amount)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${metric.nii_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(metric.nii_change_percent)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-900">
                        {metric.duration_gap.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {irrbbMetrics.length === 0 && (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No IRRBB data available.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Historical Balance Sheet Metrics</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Total Assets</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Total Liabilities</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Total Equity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Tier 1 Ratio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Leverage Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {balanceSheetMetrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(metric.report_date)}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(metric.total_assets)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(metric.total_liabilities)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                        {formatCurrency(metric.total_equity)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatPercent(metric.tier1_capital_ratio)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatPercent(metric.leverage_ratio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {balanceSheetMetrics.length === 0 && (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No balance sheet data available.</p>
              </div>
            )}
          </div>
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
