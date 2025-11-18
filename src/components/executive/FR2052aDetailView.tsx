import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Database,
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  PieChart,
  BarChart3,
  Clock,
  Users,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Breadcrumbs } from '../shared/Breadcrumbs';
import { LegalEntityFilter } from '../shared/LegalEntityFilter';

interface FR2052aRow {
  id: string;
  report_date: string;
  product: string;
  sub_product: string | null;
  sub_product2: string | null;
  counterparty: string;
  maturity_bucket: string;
  amount: number;
  is_hqla: boolean;
  hqla_level: number | null;
  haircut_rate: number;
  runoff_rate: number | null;
  rsf_factor: number | null;
  asf_factor: number | null;
  projected_inflow: number;
  projected_outflow: number;
  asset_class: string | null;
}

interface ProductSummary {
  product: string;
  count: number;
  totalAmount: number;
  hqlaAmount: number;
  projectedInflow: number;
  projectedOutflow: number;
}

interface MaturitySummary {
  maturity: string;
  amount: number;
  inflow: number;
  outflow: number;
}

interface HQLASummary {
  level: string;
  amount: number;
  percentage: number;
}

interface FR2052aDetailViewProps {
  onNavigate?: (view: string) => void;
}

export function FR2052aDetailView({ onNavigate }: FR2052aDetailViewProps) {
  const { user } = useAuth();
  const [data, setData] = useState<FR2052aRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'products' | 'maturity' | 'hqla' | 'counterparty'>('summary');

  useEffect(() => {
    loadData();
  }, [user, selectedEntityId]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('fr2052a_data_rows')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false });

    if (selectedEntityId) {
      query = query.eq('legal_entity_id', selectedEntityId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error loading FR 2052a data:', error);
      setLoading(false);
      return;
    }

    if (rows) {
      setData(rows);
      const dates = Array.from(new Set(rows.map(r => r.report_date))).sort().reverse();
      setAvailableDates(dates);
    }

    setLoading(false);
  };

  const filteredData = data.filter(row => row.report_date === selectedDate);

  const productSummaries = (): ProductSummary[] => {
    const summaryMap = new Map<string, ProductSummary>();

    filteredData.forEach(row => {
      const existing = summaryMap.get(row.product) || {
        product: row.product,
        count: 0,
        totalAmount: 0,
        hqlaAmount: 0,
        projectedInflow: 0,
        projectedOutflow: 0
      };

      summaryMap.set(row.product, {
        product: row.product,
        count: existing.count + 1,
        totalAmount: existing.totalAmount + row.amount,
        hqlaAmount: existing.hqlaAmount + (row.is_hqla ? row.amount : 0),
        projectedInflow: existing.projectedInflow + row.projected_inflow,
        projectedOutflow: existing.projectedOutflow + row.projected_outflow
      });
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const maturitySummaries = (): MaturitySummary[] => {
    const summaryMap = new Map<string, MaturitySummary>();

    filteredData.forEach(row => {
      const existing = summaryMap.get(row.maturity_bucket) || {
        maturity: row.maturity_bucket,
        amount: 0,
        inflow: 0,
        outflow: 0
      };

      summaryMap.set(row.maturity_bucket, {
        maturity: row.maturity_bucket,
        amount: existing.amount + row.amount,
        inflow: existing.inflow + row.projected_inflow,
        outflow: existing.outflow + row.projected_outflow
      });
    });

    const maturityOrder = ['overnight', '2-7days', '8-30days', '31-90days', '91-180days', '181-365days', 'gt_1year', 'open'];
    return Array.from(summaryMap.values()).sort((a, b) =>
      maturityOrder.indexOf(a.maturity) - maturityOrder.indexOf(b.maturity)
    );
  };

  const hqlaSummaries = (): HQLASummary[] => {
    const hqlaData = filteredData.filter(row => row.is_hqla);
    const totalHQLA = hqlaData.reduce((sum, row) => sum + row.amount * (1 - row.haircut_rate), 0);

    const level1 = hqlaData.filter(r => r.hqla_level === 1).reduce((sum, r) => sum + r.amount * (1 - r.haircut_rate), 0);
    const level2 = hqlaData.filter(r => r.hqla_level === 2).reduce((sum, r) => sum + r.amount * (1 - r.haircut_rate), 0);
    const level3 = hqlaData.filter(r => r.hqla_level === 3).reduce((sum, r) => sum + r.amount * (1 - r.haircut_rate), 0);

    return [
      { level: 'Level 1 (0% haircut)', amount: level1, percentage: totalHQLA > 0 ? (level1 / totalHQLA) * 100 : 0 },
      { level: 'Level 2A (15% haircut)', amount: level2, percentage: totalHQLA > 0 ? (level2 / totalHQLA) * 100 : 0 },
      { level: 'Level 2B (50% haircut)', amount: level3, percentage: totalHQLA > 0 ? (level3 / totalHQLA) * 100 : 0 }
    ];
  };

  const counterpartySummaries = () => {
    const summaryMap = new Map<string, number>();

    filteredData.forEach(row => {
      const current = summaryMap.get(row.counterparty) || 0;
      summaryMap.set(row.counterparty, current + row.amount);
    });

    return Array.from(summaryMap.entries())
      .map(([counterparty, amount]) => ({ counterparty, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const totalAmount = filteredData.reduce((sum, row) => sum + row.amount, 0);
  const hqlaAmount = filteredData.filter(r => r.is_hqla).reduce((sum, r) => sum + r.amount * (1 - r.haircut_rate), 0);
  const totalInflow = filteredData.reduce((sum, row) => sum + row.projected_inflow, 0);
  const totalOutflow = filteredData.reduce((sum, row) => sum + row.projected_outflow, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading FR 2052a data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Executive Dashboard', onClick: () => onNavigate?.('dashboard') },
          { label: 'FR 2052a Liquidity Report' }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FR 2052a Liquidity Report</h1>
          <p className="text-sm text-slate-600">Comprehensive liquidity data supporting LCR and NSFR calculations</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <LegalEntityFilter
            selectedEntityId={selectedEntityId}
            onEntityChange={setSelectedEntityId}
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableDates.map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-amber-900 mb-2">No FR 2052a Data Found</h3>
          <p className="text-sm text-amber-700 mb-4">
            Click "Seed Sample Data" in the Executive Dashboard to generate comprehensive FR 2052a reporting data.
          </p>
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">Total Line Items</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{filteredData.length.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Reporting period records</div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-slate-600">Total Outstanding</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</div>
              <div className="text-xs text-slate-500 mt-1">Aggregate balance</div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-600">HQLA (after haircuts)</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(hqlaAmount)}</div>
              <div className="text-xs text-slate-500 mt-1">
                {((hqlaAmount / totalAmount) * 100).toFixed(1)}% of total
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-slate-600">Net Cash Flow</span>
              </div>
              <div className={`text-2xl font-bold ${totalInflow - totalOutflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalInflow - totalOutflow)}
              </div>
              <div className="text-xs text-slate-500 mt-1">30-day projection</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200">
            <div className="border-b border-slate-200">
              <div className="flex gap-4 px-6">
                {[
                  { id: 'summary', label: 'Summary', icon: BarChart3 },
                  { id: 'products', label: 'Product Categories', icon: Layers },
                  { id: 'maturity', label: 'Maturity Profile', icon: Clock },
                  { id: 'hqla', label: 'HQLA Breakdown', icon: Shield },
                  { id: 'counterparty', label: 'Counterparty', icon: Users }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Cash Flow Analysis</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-slate-700">Projected Inflows (30d)</span>
                          <span className="font-semibold text-green-700">{formatCurrency(totalInflow)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <span className="text-sm text-slate-700">Projected Outflows (30d)</span>
                          <span className="font-semibold text-red-700">{formatCurrency(totalOutflow)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg border-2 border-slate-300">
                          <span className="text-sm font-medium text-slate-900">Net Cash Flow</span>
                          <span className={`font-bold ${totalInflow - totalOutflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalInflow - totalOutflow)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Coverage</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Product Categories</span>
                          <span className="font-semibold text-slate-900">
                            {new Set(filteredData.map(d => d.product)).size}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Counterparty Types</span>
                          <span className="font-semibold text-slate-900">
                            {new Set(filteredData.map(d => d.counterparty)).size}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Maturity Buckets</span>
                          <span className="font-semibold text-slate-900">
                            {new Set(filteredData.map(d => d.maturity_bucket)).size}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">HQLA Eligible Items</span>
                          <span className="font-semibold text-slate-900">
                            {filteredData.filter(d => d.is_hqla).length.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Category Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Line Items</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Amount</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">HQLA Amount</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Inflows</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Outflows</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productSummaries().map(summary => (
                          <tr key={summary.product} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 capitalize">
                              {summary.product.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700">{summary.count}</td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                              {formatCurrency(summary.totalAmount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-purple-700">
                              {formatCurrency(summary.hqlaAmount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-green-700">
                              {formatCurrency(summary.projectedInflow)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-red-700">
                              {formatCurrency(summary.projectedOutflow)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'maturity' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Maturity Profile</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Maturity Bucket</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">% of Total</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Inflows</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Outflows</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maturitySummaries().map(summary => (
                          <tr key={summary.maturity} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 capitalize">
                              {summary.maturity.replace(/_/g, ' ').replace('gt', '>')}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                              {formatCurrency(summary.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700">
                              {((summary.amount / totalAmount) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-green-700">
                              {formatCurrency(summary.inflow)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-red-700">
                              {formatCurrency(summary.outflow)}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right font-medium ${
                              summary.inflow - summary.outflow >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(summary.inflow - summary.outflow)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'hqla' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">High-Quality Liquid Assets (HQLA)</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {hqlaSummaries().map((summary, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-slate-700">{summary.level}</span>
                          </div>
                          <div className="text-2xl font-bold text-slate-900 mb-1">
                            {formatCurrency(summary.amount)}
                          </div>
                          <div className="text-sm text-slate-600">
                            {summary.percentage.toFixed(1)}% of total HQLA
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="text-md font-semibold text-slate-900 mb-3">HQLA Details</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-slate-600 mb-1">Total HQLA (pre-haircut)</div>
                            <div className="text-lg font-bold text-slate-900">
                              {formatCurrency(filteredData.filter(r => r.is_hqla).reduce((sum, r) => sum + r.amount, 0))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600 mb-1">Total HQLA (post-haircut)</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(hqlaAmount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600 mb-1">Average Haircut Rate</div>
                            <div className="text-lg font-bold text-slate-900">
                              {(filteredData.filter(r => r.is_hqla).reduce((sum, r) => sum + r.haircut_rate, 0) /
                                filteredData.filter(r => r.is_hqla).length * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600 mb-1">HQLA as % of Total Assets</div>
                            <div className="text-lg font-bold text-purple-600">
                              {((hqlaAmount / totalAmount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'counterparty' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Counterparty Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Counterparty Type</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {counterpartySummaries().map(summary => (
                          <tr key={summary.counterparty} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 capitalize">
                              {summary.counterparty.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                              {formatCurrency(summary.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700">
                              {((summary.amount / totalAmount) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
