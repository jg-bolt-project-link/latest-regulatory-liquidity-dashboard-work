import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';

interface LiquidityReport {
  id: string;
  report_date: string;
  report_type: string;
  total_assets: number;
  total_liabilities: number;
  net_liquidity: number;
  cash_ratio: number | null;
  quick_ratio: number | null;
  notes: string | null;
  created_at: string;
}

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<LiquidityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('liquidity_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false });

    if (data) setReports(data);
    setLoading(false);
  };

  const generateReport = async (reportType: string, notes: string) => {
    if (!user) return;

    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!accounts) return;

    const totalAssets = accounts
      .filter(acc => ['checking', 'savings', 'investment'].includes(acc.account_type))
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    const totalLiabilities = accounts
      .filter(acc => ['credit', 'loan'].includes(acc.account_type))
      .reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0);

    const netLiquidity = totalAssets - totalLiabilities;
    const cashRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : null;
    const quickRatio = totalLiabilities > 0 ? (totalAssets * 0.9) / totalLiabilities : null;

    const { error } = await supabase.from('liquidity_reports').insert({
      user_id: user.id,
      report_type: reportType,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_liquidity: netLiquidity,
      cash_ratio: cashRatio,
      quick_ratio: quickRatio,
      notes: notes || null,
    });

    if (!error) {
      setShowGenerateModal(false);
      loadReports();
    }
  };

  const exportToCSV = (report: LiquidityReport) => {
    const csvContent = [
      ['Liquidity Report'],
      ['Date', new Date(report.report_date).toLocaleDateString()],
      ['Type', report.report_type],
      [''],
      ['Metric', 'Value'],
      ['Total Assets', report.total_assets.toFixed(2)],
      ['Total Liabilities', report.total_liabilities.toFixed(2)],
      ['Net Liquidity', report.net_liquidity.toFixed(2)],
      ['Cash Ratio', report.cash_ratio?.toFixed(4) || 'N/A'],
      ['Quick Ratio', report.quick_ratio?.toFixed(4) || 'N/A'],
      [''],
      ['Notes', report.notes || ''],
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidity-report-${report.report_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-slate-600">Loading reports...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Liquidity Reports</h2>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No reports generated yet</p>
          <p className="text-sm text-slate-500">Generate your first liquidity report to track your financial position</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-semibold text-slate-900">{formatDate(report.report_date)}</h3>
                  </div>
                  <p className="text-sm text-slate-600 capitalize">{report.report_type} Report</p>
                </div>
                <button
                  onClick={() => exportToCSV(report)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Total Assets</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(report.total_assets)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 mb-1">Total Liabilities</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(report.total_liabilities)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${report.net_liquidity >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                  <p className={`text-sm mb-1 ${report.net_liquidity >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Liquidity</p>
                  <p className={`text-2xl font-bold ${report.net_liquidity >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                    {formatCurrency(report.net_liquidity)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Cash Ratio</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {report.cash_ratio ? report.cash_ratio.toFixed(4) : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Quick Ratio</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {report.quick_ratio ? report.quick_ratio.toFixed(4) : 'N/A'}
                  </p>
                </div>
              </div>

              {report.notes && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Notes</p>
                  <p className="text-slate-900">{report.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showGenerateModal && (
        <GenerateReportModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={generateReport}
        />
      )}
    </div>
  );
}

function GenerateReportModal({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (reportType: string, notes: string) => void;
}) {
  const [reportType, setReportType] = useState('monthly');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onGenerate(reportType, notes);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Generate Liquidity Report</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any observations or context for this report..."
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
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
