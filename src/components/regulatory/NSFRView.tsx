import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Target, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { MetricDetailModal, NSFR_METRIC } from './MetricDetailModal';

interface NSFRMetric {
  id: string;
  report_date: string;
  available_stable_funding: number;
  required_stable_funding: number;
  nsfr_ratio: number;
  is_compliant: boolean;
  retail_deposits: number;
  wholesale_funding: number;
  notes: string | null;
}

interface NSFRViewProps {
  onBack: () => void;
}

export function NSFRView({ onBack }: NSFRViewProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<NSFRMetric[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('nsfr_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(20);

    console.log('NSFR Metrics loaded:', { data, error, userId: user.id });

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

  const avgNSFR = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.nsfr_ratio, 0) / metrics.length
    : 0;

  const compliantCount = metrics.filter(m => m.is_compliant).length;

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
            <h2 className="text-2xl font-bold text-slate-900">Net Stable Funding Ratio (NSFR)</h2>
            <button
              onClick={() => setShowDetailModal(true)}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
              title="View detailed metric information"
            >
              <Info className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-1">Basel III / FR 2065 Structural Liquidity Reporting</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add NSFR Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600">Average NSFR</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatPercent(avgNSFR)}</p>
          <p className="text-xs text-slate-500 mt-2">Regulatory Minimum: 100%</p>
        </div>

        <div className={`rounded-xl shadow-sm p-6 border-2 ${
          compliantCount === metrics.length && metrics.length > 0 ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              compliantCount === metrics.length && metrics.length > 0 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {compliantCount === metrics.length && metrics.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <p className="text-sm text-slate-700">Compliant Quarters</p>
          </div>
          <p className={`text-3xl font-bold ${
            compliantCount === metrics.length && metrics.length > 0 ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {compliantCount} / {metrics.length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Target className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm text-slate-600">Latest ASF</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {metrics[0] ? formatCurrency(metrics[0].available_stable_funding) : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-2">Available Stable Funding</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-slate-900 mb-4">NSFR Formula</h3>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-center text-lg mb-2">
            <span className="font-mono font-semibold">NSFR = (Available Stable Funding / Required Stable Funding) × 100</span>
          </p>
          <div className="text-sm text-slate-600 space-y-1">
            <p>• <strong>ASF</strong>: Stable funding from capital, deposits, and long-term borrowings</p>
            <p>• <strong>RSF</strong>: Stability of assets and off-balance sheet exposures</p>
            <p>• <strong>Time Horizon</strong>: One year stressed scenario</p>
            <p>• <strong>Minimum Requirement</strong>: 100% (Category II institutions)</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading NSFR data...</div>
      ) : metrics.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No NSFR data recorded</p>
          <p className="text-sm text-slate-500">Add your first NSFR calculation for structural liquidity tracking</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 px-6 py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">ASF</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">RSF</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Retail Deposits</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">Wholesale Funding</th>
                  <th className="text-right text-xs font-semibold text-slate-600 px-6 py-3">NSFR</th>
                  <th className="text-center text-xs font-semibold text-slate-600 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{formatDate(metric.report_date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.available_stable_funding)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.required_stable_funding)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.retail_deposits)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(metric.wholesale_funding)}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      metric.is_compliant ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(metric.nsfr_ratio)}
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
        <NSFRModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadMetrics();
          }}
        />
      )}

      {showDetailModal && (
        <MetricDetailModal
          metric={NSFR_METRIC}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}

function NSFRModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    available_stable_funding: '',
    required_stable_funding: '',
    retail_deposits: '',
    wholesale_funding: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const asf = parseFloat(formData.available_stable_funding) || 0;
    const rsf = parseFloat(formData.required_stable_funding) || 0;
    const nsfrRatio = rsf > 0 ? asf / rsf : 0;

    setLoading(true);
    const { error } = await supabase.from('nsfr_metrics').insert({
      user_id: user.id,
      report_date: formData.report_date,
      available_stable_funding: asf,
      required_stable_funding: rsf,
      nsfr_ratio: nsfrRatio,
      is_compliant: nsfrRatio >= 1.0,
      retail_deposits: parseFloat(formData.retail_deposits) || 0,
      wholesale_funding: parseFloat(formData.wholesale_funding) || 0,
      notes: formData.notes || null,
    });

    setLoading(false);
    if (!error) onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Add NSFR Data</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Available Stable Funding (ASF)</label>
              <input
                type="number"
                step="0.01"
                value={formData.available_stable_funding}
                onChange={(e) => setFormData({ ...formData, available_stable_funding: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Required Stable Funding (RSF)</label>
              <input
                type="number"
                step="0.01"
                value={formData.required_stable_funding}
                onChange={(e) => setFormData({ ...formData, required_stable_funding: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Retail Deposits</label>
              <input
                type="number"
                step="0.01"
                value={formData.retail_deposits}
                onChange={(e) => setFormData({ ...formData, retail_deposits: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Wholesale Funding</label>
              <input
                type="number"
                step="0.01"
                value={formData.wholesale_funding}
                onChange={(e) => setFormData({ ...formData, wholesale_funding: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
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
              {loading ? 'Saving...' : 'Save NSFR Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
