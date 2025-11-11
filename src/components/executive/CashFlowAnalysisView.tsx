import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Activity, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LegalEntityFilter } from '../shared/LegalEntityFilter';

interface CashFlowAnalysisViewProps {
  onNavigate?: (view: string) => void;
}

interface CashFlowData {
  date: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  cumulativeBalance: number;
}

export function CashFlowAnalysisView({ onNavigate }: CashFlowAnalysisViewProps) {
  const { user } = useAuth();
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  useEffect(() => {
    loadCashFlowData();
  }, [user, selectedPeriod, selectedEntity]);

  const loadCashFlowData = async () => {
    if (!user) return;

    try {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[selectedPeriod];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      console.log('Loaded transactions:', transactions?.length);

      const dailyFlows = new Map<string, { inflows: number; outflows: number }>();

      transactions?.forEach(t => {
        const date = new Date(t.transaction_date).toLocaleDateString();
        if (!dailyFlows.has(date)) {
          dailyFlows.set(date, { inflows: 0, outflows: 0 });
        }
        const flow = dailyFlows.get(date)!;
        if (t.amount > 0) {
          flow.inflows += t.amount;
        } else {
          flow.outflows += Math.abs(t.amount);
        }
      });

      let cumulativeBalance = 0;
      const flowData: CashFlowData[] = Array.from(dailyFlows.entries()).map(([date, flow]) => {
        const netFlow = flow.inflows - flow.outflows;
        cumulativeBalance += netFlow;
        return {
          date,
          inflows: flow.inflows,
          outflows: flow.outflows,
          netFlow,
          cumulativeBalance,
        };
      });

      console.log('Cash flow data points:', flowData.length);
      setCashFlowData(flowData);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
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

  const totalInflows = cashFlowData.reduce((sum, d) => sum + d.inflows, 0);
  const totalOutflows = cashFlowData.reduce((sum, d) => sum + d.outflows, 0);
  const netCashFlow = totalInflows - totalOutflows;
  const avgDailyInflow = cashFlowData.length > 0 ? totalInflows / cashFlowData.length : 0;
  const avgDailyOutflow = cashFlowData.length > 0 ? totalOutflows / cashFlowData.length : 0;

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
          <h1 className="text-2xl font-bold text-slate-900">Cash Flow Analysis</h1>
          <p className="text-sm text-slate-600">Comprehensive cash flow monitoring and projections</p>
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
              Cash flow analysis tracks operational inflows and outflows to monitor liquidity generation and consumption patterns.
              Understanding cash flow dynamics is essential for liquidity risk management and operational planning.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-slate-900 mb-1">Key Insights:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                  <li>Monitor operational cash generation and identify trends</li>
                  <li>Detect periods of cash flow stress or surplus</li>
                  <li>Support short-term liquidity forecasting</li>
                  <li>Identify seasonal patterns and business cycle impacts</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <p className="font-medium text-slate-900 mb-2">Related Regulatory Requirements:</p>
                <div className="space-y-1">
                  <a
                    href="https://www.federalreserve.gov/supervisionreg/srletters/sr1317a1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Federal Reserve SR 13-17: Liquidity Risk Management</span>
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
              <strong>Data Source:</strong> Representative sample transaction data generated for demonstration purposes.
              Data patterns are modeled on typical institutional banking transaction flows but are not sourced from actual State Street Corporation filings.
            </p>
          </div>
        </div>
      </div>

      <div>
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Period:</span>
              <div className="flex gap-2">
                {(['7d', '30d', '90d', '1y'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period === '1y' ? '1 Year' : period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <LegalEntityFilter
              selectedEntity={selectedEntity}
              onEntityChange={setSelectedEntity}
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading cash flow data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Total Inflows</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totalInflows)}</p>
                  <p className="text-xs text-green-600 mt-1">Avg: {formatCurrency(avgDailyInflow)}/day</p>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Total Outflows</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(totalOutflows)}</p>
                  <p className="text-xs text-red-600 mt-1">Avg: {formatCurrency(avgDailyOutflow)}/day</p>
                </div>

                <div className={`rounded-xl p-4 border ${netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`w-4 h-4 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-sm font-medium ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Cash Flow</span>
                  </div>
                  <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(netCashFlow)}
                  </p>
                  <p className={`text-xs mt-1 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netCashFlow >= 0 ? 'Positive' : 'Negative'}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Data Points</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{cashFlowData.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Days with activity</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">Daily Cash Flow Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Inflows
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Outflows
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Net Flow
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Cumulative Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cashFlowData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No cash flow data available for the selected period
                          </td>
                        </tr>
                      ) : (
                        cashFlowData.map((flow, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">{flow.date}</td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(flow.inflows)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                              {formatCurrency(flow.outflows)}
                            </td>
                            <td className={`px-6 py-4 text-sm text-right font-semibold ${flow.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(flow.netFlow)}
                            </td>
                            <td className={`px-6 py-4 text-sm text-right font-bold ${flow.cumulativeBalance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                              {formatCurrency(flow.cumulativeBalance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
