import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, TrendingUp, AlertTriangle, CheckCircle, Info, BarChart3 } from 'lucide-react';
import { MetricDetailModal, LCR_METRIC } from './MetricDetailModal';
import { DataVisualization } from '../shared/DataVisualization';

interface LCRMetric {
  id: string;
  report_date: string;
  hqla_level_1: number;
  hqla_level_2a: number;
  hqla_level_2b: number;
  total_hqla: number;
  total_net_cash_outflows: number;
  lcr_ratio: number;
  is_compliant: boolean;
  notes: string | null;
}

interface LCRViewProps {
  onBack: () => void;
}

export function LCRView({ onBack }: LCRViewProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<LCRMetric[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVisualization, setShowVisualization] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    

    const { data, error } = await supabase
      .from('lcr_metrics')
      .select('*')
      .is('user_id', null)
      .order('report_date', { ascending: false })
      .limit(30);

    console.log('LCR Metrics loaded:', { data, error });

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

  const avgLCR = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.lcr_ratio, 0) / metrics.length
    : 0;

  const compliantCount = metrics.filter(m => m.is_compliant).length;
  const complianceRate = metrics.length > 0 ? (compliantCount / metrics.length) * 100 : 0;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Liquidity Coverage Ratio (LCR)</h2>
            <button
              onClick={() => setShowVisualization(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              title="Visualize LCR Data"
            >
              <BarChart3 className="w-4 h-4" />
              Visualize
            </button>
            <button
              onClick={() => setShowDetailModal(true)}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
              title="View detailed metric information"
            >
              <Info className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-1">Basel III / Regulation YY / FR 2052a Reporting</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add LCR Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600">Average LCR (30 Days)</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatPercent(avgLCR)}</p>
          <p className="text-xs text-slate-500 mt-2">Regulatory Minimum: 100%</p>
        </div>

        <div className={`rounded-xl shadow-sm p-6 border-2 ${
          complianceRate === 100 ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              complianceRate === 100 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {complianceRate === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <p className="text-sm text-slate-700">Compliance Rate</p>
          </div>
          <p className={`text-3xl font-bold ${
            complianceRate === 100 ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {complianceRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-600 mt-2">{compliantCount} of {metrics.length} days compliant</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm text-slate-600">Latest HQLA</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {metrics[0] ? formatCurrency(metrics[0].total_hqla) : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-2">High Quality Liquid Assets</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-slate-900 mb-4">LCR Formula</h3>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
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
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading LCR data...</div>
      ) : metrics.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No LCR data recorded</p>
          <p className="text-sm text-slate-500">Add your first LCR calculation to begin tracking compliance</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 px-6 py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Level 1 HQLA</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Level 2A HQLA</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Level 2B HQLA</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Total HQLA</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Net Outflows</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">LCR</th>
                  <th className="text-center text-xs font-semibold text-slate-600 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.hqla_level_1)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.hqla_level_2a)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.hqla_level_2b)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">{formatCurrency(metric.total_hqla)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.total_net_cash_outflows)}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      metric.is_compliant ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(metric.lcr_ratio)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {metric.is_compliant ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          <CheckCircle className="w-3 h-3" />
                          Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          <AlertTriangle className="w-3 h-3" />
                          Non-Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <LCRModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadMetrics();
          }}
        />
      )}

      {showDetailModal && (
        <MetricDetailModal
          metric={LCR_METRIC}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}

function LCRModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    hqla_level_1: '',
    hqla_level_2a: '',
    hqla_level_2b: '',
    total_net_cash_outflows: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    const level1 = parseFloat(formData.hqla_level_1) || 0;
    const level2a = parseFloat(formData.hqla_level_2a) || 0;
    const level2b = parseFloat(formData.hqla_level_2b) || 0;
    const totalHQLA = level1 + (level2a * 0.85) + (level2b * 0.50);
    const netOutflows = parseFloat(formData.total_net_cash_outflows) || 0;
    const lcrRatio = netOutflows > 0 ? totalHQLA / netOutflows : 0;

    setLoading(true);
    const { error } = await supabase.from('lcr_metrics').insert({
      user_id: null,
      report_date: formData.report_date,
      hqla_level_1: level1,
      hqla_level_2a: level2a,
      hqla_level_2b: level2b,
      total_hqla: totalHQLA,
      total_net_cash_outflows: netOutflows,
      lcr_ratio: lcrRatio,
      is_compliant: lcrRatio >= 1.0,
      notes: formData.notes || null,
    });

    setLoading(false);
    if (!error) onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Add LCR Data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Date</label>
            <input
              type="date"
              value={formData.report_date}
              onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 1 HQLA</label>
              <input
                type="number"
                step="0.01"
                value={formData.hqla_level_1}
                onChange={(e) => setFormData({ ...formData, hqla_level_1: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">100% haircut factor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 2A HQLA</label>
              <input
                type="number"
                step="0.01"
                value={formData.hqla_level_2a}
                onChange={(e) => setFormData({ ...formData, hqla_level_2a: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">85% haircut factor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 2B HQLA</label>
              <input
                type="number"
                step="0.01"
                value={formData.hqla_level_2b}
                onChange={(e) => setFormData({ ...formData, hqla_level_2b: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">50% haircut factor</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Total Net Cash Outflows (30-day)</label>
            <input
              type="number"
              step="0.01"
              value={formData.total_net_cash_outflows}
              onChange={(e) => setFormData({ ...formData, total_net_cash_outflows: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional context or observations..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save LCR Data'}
            </button>
          </div>
        </form>
      </div>

      {/* Data Visualization Modal */}
      <DataVisualization
        isOpen={showVisualization}
        onClose={() => setShowVisualization(false)}
        title="LCR Metrics Visualization"
        data={metrics}
        availableAttributes={[
          { name: 'report_date', label: 'Report Date', type: 'date' },
          { name: 'is_compliant', label: 'Compliant', type: 'boolean' },
          { name: 'total_hqla', label: 'Total HQLA', type: 'number' },
          { name: 'hqla_level_1', label: 'Level 1 HQLA', type: 'number' },
          { name: 'hqla_level_2a', label: 'Level 2A HQLA', type: 'number' },
          { name: 'hqla_level_2b', label: 'Level 2B HQLA', type: 'number' },
          { name: 'total_net_cash_outflows', label: 'Net Cash Outflows', type: 'number' },
          { name: 'lcr_ratio', label: 'LCR Ratio (%)', type: 'number' }
        ]}
        defaultAggregateField="total_hqla"
      />
    </div>
  );
}
