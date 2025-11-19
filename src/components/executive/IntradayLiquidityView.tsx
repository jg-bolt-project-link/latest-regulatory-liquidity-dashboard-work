import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, TrendingUp, AlertCircle, CheckCircle, Activity, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface IntradayLiquidityViewProps {
  onNavigate?: (view: string) => void;
}

interface IntradayPosition {
  time: string;
  availableLiquidity: number;
  requiredLiquidity: number;
  peakUsage: number;
  coverage: number;
}

export function IntradayLiquidityView({ onNavigate }: IntradayLiquidityViewProps) {
  const { user } = useAuth();
  const [positions, setPositions] = useState<IntradayPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    peakRequirement: 0,
    totalAvailable: 0,
    averageCoverage: 0,
    minCoverage: 0,
  });

  useEffect(() => {
    loadIntradayData();
  }, []);

  const loadIntradayData = async () => {
    

    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .is('user_id', null)
        .eq('is_active', true);

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
        throw accountsError;
      }

      console.log('Loaded accounts:', accounts?.length);

      const totalAssets = accounts
        ?.filter(acc => ['checking', 'savings', 'investment'].includes(acc.account_type))
        .reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

      console.log('Total assets for intraday:', totalAssets);

      const businessHours = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
      ];

      const intradayPositions: IntradayPosition[] = businessHours.map((time, index) => {
        const hourProgress = index / (businessHours.length - 1);
        const peakUsage = totalAssets * (0.10 + Math.sin(hourProgress * Math.PI) * 0.08);
        const requiredLiquidity = peakUsage * 1.2;
        const availableLiquidity = totalAssets - (peakUsage * 0.5);
        const coverage = (availableLiquidity / requiredLiquidity) * 100;

        return {
          time,
          availableLiquidity,
          requiredLiquidity,
          peakUsage,
          coverage,
        };
      });

      const peakRequirement = Math.max(...intradayPositions.map(p => p.requiredLiquidity));
      const avgCoverage = intradayPositions.reduce((sum, p) => sum + p.coverage, 0) / intradayPositions.length;
      const minCoverage = Math.min(...intradayPositions.map(p => p.coverage));

      console.log('Intraday positions calculated:', intradayPositions.length);

      setPositions(intradayPositions);
      setMetrics({
        peakRequirement,
        totalAvailable: totalAssets,
        averageCoverage: avgCoverage,
        minCoverage,
      });
    } catch (error) {
      console.error('Error loading intraday data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 120) return 'text-green-600';
    if (coverage >= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageBg = (coverage: number) => {
    if (coverage >= 120) return 'bg-green-50 border-green-200';
    if (coverage >= 100) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Intraday Liquidity Monitoring</h1>
          <p className="text-sm text-slate-600">Real-time liquidity positions throughout the business day</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">About This Metric</h3>
            <p className="text-sm text-slate-700 mb-4">
              Intraday liquidity monitoring tracks an institution's ability to meet payment and settlement obligations throughout the business day,
              including obligations to Financial Market Utilities (FMUs) and payment systems. This metric is critical for operational resilience,
              systemic risk management, and compliance with regulatory expectations.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-slate-900 mb-1">Key Financial Market Utilities (FMUs):</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                  <li><strong>Fedwire:</strong> Federal Reserve's real-time gross settlement system</li>
                  <li><strong>CHIPS:</strong> Clearing House Interbank Payments System for large-value USD payments</li>
                  <li><strong>DTC:</strong> Depository Trust Company for securities custody and settlement</li>
                  <li><strong>NSCC:</strong> National Securities Clearing Corporation for equity and debt clearing</li>
                  <li><strong>FICC:</strong> Fixed Income Clearing Corporation for government securities</li>
                  <li><strong>CLS Bank:</strong> Continuous Linked Settlement for FX transactions</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="font-medium text-slate-900 mb-1">Regulatory Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                  <li>BCBS 248: Monitoring tools for intraday liquidity management</li>
                  <li>Federal Reserve requires real-time payment system monitoring and daylight overdraft management</li>
                  <li>Institutions must identify and monitor peak intraday liquidity usage across all FMUs</li>
                  <li>Daily monitoring of maximum daylight overdraft and time-specific net debit positions</li>
                  <li>Stress testing of intraday liquidity positions including FMU access disruptions</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="font-medium text-slate-900 mb-2">Regulatory Resources:</p>
                <div className="space-y-1">
                  <a
                    href="https://www.bis.org/publ/bcbs248.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>BCBS 248 - Monitoring Tools for Intraday Liquidity Management</span>
                  </a>
                  <a
                    href="https://www.federalreserve.gov/paymentsystems/psr_about.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Federal Reserve - Payment System Risk Policy</span>
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
              <strong>Data Source:</strong> Representative calculated positions based on account balances.
              Intraday positions are simulated using typical institutional payment patterns and are not sourced from actual State Street Corporation real-time payment data.
            </p>
          </div>
        </div>
      </div>

      <div>
          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading intraday liquidity data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Peak Requirement</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.peakRequirement)}</p>
                  <p className="text-xs text-purple-600 mt-1">Highest intraday need</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Total Available</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalAvailable)}</p>
                  <p className="text-xs text-blue-600 mt-1">Available liquidity</p>
                </div>

                <div className={`rounded-xl p-4 border ${getCoverageBg(metrics.averageCoverage)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className={`w-4 h-4 ${getCoverageColor(metrics.averageCoverage)}`} />
                    <span className={`text-sm font-medium ${getCoverageColor(metrics.averageCoverage)}`}>Avg Coverage</span>
                  </div>
                  <p className={`text-2xl font-bold ${getCoverageColor(metrics.averageCoverage)}`}>
                    {metrics.averageCoverage.toFixed(0)}%
                  </p>
                  <p className={`text-xs mt-1 ${getCoverageColor(metrics.averageCoverage)}`}>
                    {metrics.averageCoverage >= 120 ? 'Strong' : metrics.averageCoverage >= 100 ? 'Adequate' : 'Weak'}
                  </p>
                </div>

                <div className={`rounded-xl p-4 border ${getCoverageBg(metrics.minCoverage)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className={`w-4 h-4 ${getCoverageColor(metrics.minCoverage)}`} />
                    <span className={`text-sm font-medium ${getCoverageColor(metrics.minCoverage)}`}>Min Coverage</span>
                  </div>
                  <p className={`text-2xl font-bold ${getCoverageColor(metrics.minCoverage)}`}>
                    {metrics.minCoverage.toFixed(0)}%
                  </p>
                  <p className={`text-xs mt-1 ${getCoverageColor(metrics.minCoverage)}`}>Lowest point</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">Hourly Intraday Position</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Available
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Required
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Peak Usage
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Coverage
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {positions.map((position, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{position.time}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">
                            {formatCurrency(position.availableLiquidity)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-slate-600">
                            {formatCurrency(position.requiredLiquidity)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-purple-600">
                            {formatCurrency(position.peakUsage)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-bold ${getCoverageColor(position.coverage)}`}>
                            {position.coverage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            {position.coverage >= 120 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Strong
                              </span>
                            ) : position.coverage >= 100 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Adequate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Weak
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Key Insights</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span>Intraday liquidity is monitored hourly to ensure sufficient funds for payment obligations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span>Coverage above 120% indicates strong liquidity buffer throughout the day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span>Peak usage typically occurs mid-day during high transaction volumes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span>Minimum coverage should remain above 100% to meet regulatory expectations</span>
                  </li>
                </ul>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
