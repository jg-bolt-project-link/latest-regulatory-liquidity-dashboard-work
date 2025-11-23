import { useState, useEffect } from 'react';
import { TrendingUp, Plus, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Projection {
  id: string;
  projection_date: string;
  time_horizon: string;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  available_liquidity: number;
}

export function CashFlowProjectionsScreen() {
  const [projections, setProjections] = useState<Projection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('30_day');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cash_flow_projections')
      .select('*')
      .order('projection_date', { ascending: false });
    if (data) setProjections(data);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    const billions = value / 1000000000;
    return `$${billions.toFixed(2)}B`;
  };

  const horizonProj = projections.filter(p => p.time_horizon === selectedHorizon);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Cash Flow Projections
          </h2>
          <p className="text-slate-600 mt-1">Forward-looking liquidity analysis per Reg QQ § 39.3</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-1">Regulation QQ § 39.3</h3>
        <p className="text-sm text-blue-800">
          Covered banks must produce comprehensive cash flow projections over short- and long-term time horizons,
          projecting cash flows from assets, liabilities, and off-balance sheet exposures.
        </p>
      </div>

      {/* Time Horizon Selector */}
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

      {/* Projections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {horizonProj.slice(0, 6).map(proj => (
          <div key={proj.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-3">{proj.projection_date}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Inflows:</span>
                <span className="font-semibold text-green-600">{formatCurrency(proj.total_inflows)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Outflows:</span>
                <span className="font-semibold text-red-600">{formatCurrency(proj.total_outflows)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-sm font-medium text-slate-900">Net Cash Flow:</span>
                <span className={`font-bold ${proj.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(proj.net_cash_flow)}
                </span>
              </div>
              {proj.available_liquidity && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Available Liquidity:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(proj.available_liquidity)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {horizonProj.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No cash flow projections for {selectedHorizon.replace('_', ' ')} horizon</p>
        </div>
      )}
    </div>
  );
}
