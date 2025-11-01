import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ResolutionMetric {
  id: string;
  report_date: string;
  rcap_amount: number;
  rcap_ratio: number;
  rcap_requirement: number;
  rcap_surplus_deficit: number;
  rcen_amount: number;
  rcen_ratio: number;
  rcen_requirement: number;
  rlap_amount: number;
  rlap_ratio: number;
  rlap_requirement: number;
  rlap_surplus_deficit: number;
  rlen_amount: number;
  rlen_ratio: number;
  rlen_requirement: number;
  resolution_strategy: string;
  is_compliant: boolean;
}

export function ResolutionLiquidityDetailView({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ResolutionMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('resolution_liquidity_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(10);

    console.log('Resolution liquidity metrics loaded:', { data, error });

    if (data) setMetrics(data);
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

  const latest = metrics[0];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Loading resolution metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Resolution Liquidity</h2>
              <p className="text-sm text-slate-600">RCAP, RCEN, RLAP, RLEN Metrics</p>
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
          {latest && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`rounded-xl p-6 border-2 ${
                  latest.rcap_surplus_deficit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-600 mb-2">RCAP</h4>
                    <p className="text-xs text-slate-500">Resolution Capital Adequacy Position</p>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold ${latest.rcap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatPercent(latest.rcap_ratio)}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rcap_amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Requirement</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rcap_requirement)}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-slate-300">
                        <span className="text-slate-700 font-medium">Surplus/Deficit</span>
                        <span className={`font-bold ${latest.rcap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(latest.rcap_surplus_deficit)}
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
                    <p className="text-3xl font-bold text-blue-700">
                      {formatPercent(latest.rcen_ratio)}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rcen_amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Requirement</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rcen_requirement)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-6 border-2 ${
                  latest.rlap_surplus_deficit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-600 mb-2">RLAP</h4>
                    <p className="text-xs text-slate-500">Resolution Liquidity Adequacy Position</p>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold ${latest.rlap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatPercent(latest.rlap_ratio)}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rlap_amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Requirement</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rlap_requirement)}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-slate-300">
                        <span className="text-slate-700 font-medium">Surplus/Deficit</span>
                        <span className={`font-bold ${latest.rlap_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(latest.rlap_surplus_deficit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-6 border-2 bg-purple-50 border-purple-300">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-600 mb-2">RLEN</h4>
                    <p className="text-xs text-slate-500">Resolution Liquidity Execution Need</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-700">
                      {formatPercent(latest.rlen_ratio)}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rlen_amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Requirement</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(latest.rlen_requirement)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Resolution Strategy</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-slate-900">{latest.resolution_strategy}</p>
                    <p className="text-sm text-slate-600 mt-1">As of {formatDate(latest.report_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {latest.is_compliant ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">Compliant</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <span className="text-sm font-semibold text-red-700">Non-Compliant</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Historical Resolution Metrics</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">RCAP</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">RCEN</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">RLAP</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">RLEN</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(metric.report_date)}</td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-sm font-semibold ${metric.rcap_surplus_deficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(metric.rcap_ratio)}
                        </p>
                        <p className="text-xs text-slate-500">{formatCurrency(metric.rcap_surplus_deficit)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-blue-600">{formatPercent(metric.rcen_ratio)}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(metric.rcen_amount)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-sm font-semibold ${metric.rlap_surplus_deficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(metric.rlap_ratio)}
                        </p>
                        <p className="text-xs text-slate-500">{formatCurrency(metric.rlap_surplus_deficit)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-purple-600">{formatPercent(metric.rlen_ratio)}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(metric.rlen_amount)}</p>
                      </td>
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

            {metrics.length === 0 && (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No resolution liquidity data available.</p>
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
