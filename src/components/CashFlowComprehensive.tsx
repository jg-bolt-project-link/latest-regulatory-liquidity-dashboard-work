import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HistoricalData {
  date: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  cumulativeBalance: number;
}

interface Projection {
  id: string;
  projection_date: string;
  time_horizon: string;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  available_liquidity: number;
}

interface Scenario {
  id: string;
  scenario_name: string;
  scenario_type: string;
}

export function CashFlowComprehensive() {
  const [activeTab, setActiveTab] = useState<'historical' | 'projections'>('historical');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  // Historical filters
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Projection filters
  const [selectedHorizon, setSelectedHorizon] = useState<string>('30_day');
  const [selectedScenario, setSelectedScenario] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedHorizon, selectedScenario]);

  const loadData = async () => {
    setLoading(true);

    // Load historical transactions
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[selectedPeriod];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [transactionsResult, projectionsResult, scenariosResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .is('user_id', null)
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: true }),
      supabase.from('cash_flow_projections').select('*').order('projection_date', { ascending: false }),
      supabase.from('cash_flow_scenarios').select('*')
    ]);

    // Process historical data
    if (transactionsResult.data) {
      const dailyFlows = new Map<string, { inflows: number; outflows: number }>();

      transactionsResult.data.forEach(t => {
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
      const flowData: HistoricalData[] = Array.from(dailyFlows.entries()).map(([date, flow]) => {
        const netFlow = flow.inflows - flow.outflows;
        cumulativeBalance += netFlow;
        return { date, inflows: flow.inflows, outflows: flow.outflows, netFlow, cumulativeBalance };
      });

      setHistoricalData(flowData);
    }

    if (projectionsResult.data) setProjections(projectionsResult.data);
    if (scenariosResult.data) setScenarios(scenariosResult.data);

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    const billions = Math.abs(value) / 1000000000;
    return `${value < 0 ? '-' : ''}$${billions.toFixed(2)}B`;
  };

  const formatCompact = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  // Filter projections
  const filteredProjections = projections.filter(p => {
    const matchesHorizon = p.time_horizon === selectedHorizon;
    const matchesScenario = selectedScenario === 'all' || p.scenario_id === selectedScenario;
    return matchesHorizon && matchesScenario;
  });

  // Calculate totals
  const totalHistoricalInflows = historicalData.reduce((sum, d) => sum + d.inflows, 0);
  const totalHistoricalOutflows = historicalData.reduce((sum, d) => sum + d.outflows, 0);
  const totalHistoricalNet = totalHistoricalInflows - totalHistoricalOutflows;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading cash flow data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-green-600" />
          Comprehensive Cash Flow Analysis
        </h2>
        <p className="text-slate-600 mt-1">
          Historical analysis and forward-looking projections per Reg QQ § 39.3
        </p>
      </div>

      {/* Regulatory Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Regulation QQ § 39.3 - Cash Flow Projections</h3>
            <p className="text-sm text-blue-800">
              Covered banks must produce comprehensive cash flow projections over short- and long-term time horizons
              (overnight, 30-day, 90-day, one-year) projecting cash flows from assets, liabilities, and off-balance
              sheet exposures under baseline and stressed scenarios.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'historical'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Historical Analysis
          </div>
        </button>
        <button
          onClick={() => setActiveTab('projections')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'projections'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Forward Projections (Reg QQ)
          </div>
        </button>
      </div>

      {/* HISTORICAL TAB */}
      {activeTab === 'historical' && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Total Inflows</p>
              <p className="text-2xl font-bold text-green-600">{formatCompact(totalHistoricalInflows)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Total Outflows</p>
              <p className="text-2xl font-bold text-red-600">{formatCompact(totalHistoricalOutflows)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${totalHistoricalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCompact(totalHistoricalNet)}
              </p>
            </div>
          </div>

          {/* Historical Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Inflows</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Outflows</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Net Flow</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historicalData.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{row.date}</td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                        {formatCompact(row.inflows)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                        {formatCompact(row.outflows)}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-medium ${row.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCompact(row.netFlow)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900 font-medium">
                        {formatCompact(row.cumulativeBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {historicalData.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600">No historical transaction data available for selected period</p>
            </div>
          )}
        </div>
      )}

      {/* PROJECTIONS TAB */}
      {activeTab === 'projections' && (
        <div className="space-y-6">
          {/* Horizon & Scenario Selectors */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time Horizon</label>
              <div className="flex gap-2">
                {['overnight', '1_week', '30_day', '90_day', '1_year'].map(horizon => (
                  <button
                    key={horizon}
                    onClick={() => setSelectedHorizon(horizon)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedHorizon === horizon
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {horizon.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {scenarios.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="all">All Scenarios</option>
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.scenario_name} ({s.scenario_type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Projections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProjections.slice(0, 12).map(proj => (
              <div key={proj.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <p className="text-sm text-slate-600 mb-3">{proj.projection_date}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Inflows:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(proj.total_inflows)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Outflows:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(proj.total_outflows)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="text-sm font-medium text-slate-900">Net:</span>
                    <span className={`font-bold ${proj.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(proj.net_cash_flow)}
                    </span>
                  </div>
                  {proj.available_liquidity && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Liquidity:</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(proj.available_liquidity)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredProjections.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No projections for {selectedHorizon.replace('_', ' ')} horizon</p>
              <p className="text-sm text-slate-500 mt-1">Forward-looking cash flow projections will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
