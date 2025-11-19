import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Download,
  Filter,
  X,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface FR2052aData {
  id: string;
  report_date: string;
  product: string;
  sub_product: string;
  counterparty: string;
  maturity_bucket: string;
  amount: number;
  projected_inflow: number;
  projected_outflow: number;
  is_hqla: boolean;
  asset_class: string;
  legal_entity_id: string;
}

interface FR2052aQualityCheck {
  id: string;
  check_name: string;
  check_category: string;
  frb_rule_reference: string;
  status: string;
  severity: string;
  passed_products: number;
  failed_products: number;
}

export function FR2052aDashboard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [productData, setProductData] = useState<FR2052aData[]>([]);
  const [qualityChecks, setQualityChecks] = useState<FR2052aQualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'quality' | 'summary'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    

    const { data: dataResult } = await supabase
      .from('fr2052a_data_rows')
      .select('*')
      .is('user_id', null)
      .order('report_date', { ascending: false })
      .order('product')
      .limit(100);

    const qualityChecks: FR2052aQualityCheck[] = [];

    if (dataResult) setProductData(dataResult);
    setQualityChecks(qualityChecks);
    setLoading(false);
  };

  const filteredData = productData.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sub_product || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.product === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(productData.map(d => d.product)))];

  const totalOutstanding = productData.reduce((sum, d) => sum + (d.amount || 0), 0);
  const hqlaAmount = productData.filter(d => d.is_hqla).reduce((sum, d) => sum + (d.amount || 0), 0);
  const passedChecks = qualityChecks.filter(c => c.status === 'passed').length;
  const criticalIssues = qualityChecks.filter(c => c.severity === 'critical' && c.status === 'failed').length;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Loading FR 2052a data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">FR 2052a Complex Institution Liquidity Monitoring Report</h2>
                <p className="text-sm text-slate-600">Federal Reserve Board regulatory reporting and data quality</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{productData.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totalOutstanding)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">HQLA Amount</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(hqlaAmount)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className={`bg-gradient-to-br ${criticalIssues > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-green-50 to-green-100 border-green-200'} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${criticalIssues > 0 ? 'text-red-900' : 'text-green-900'}`}>Quality Status</p>
                  <p className={`text-3xl font-bold ${criticalIssues > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {passedChecks}/{qualityChecks.length}
                  </p>
                </div>
                {criticalIssues > 0 ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Product Data
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'quality'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Quality Checks
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">By Product Category</h3>
                  <div className="space-y-3">
                    {categories.filter(c => c !== 'all').map((category) => {
                      const count = productData.filter(d => d.product_category === category).length;
                      const amount = productData.filter(d => d.product_category === category)
                        .reduce((sum, d) => sum + d.outstanding_balance, 0);
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-900 capitalize">{category}</p>
                            <p className="text-xs text-slate-600">{count} products</p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(amount)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quality Check Status</h3>
                  <div className="space-y-3">
                    {qualityChecks.slice(0, 5).map((check) => (
                      <div key={check.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <span className="text-sm text-slate-900">{check.check_name}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(check.severity)}`}>
                          {check.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">FR 2052a Reporting Requirements</h3>
                <p className="text-sm text-slate-600 mb-4">
                  The FR 2052a collects detailed quantitative information on liquidity-related items such as cash flows,
                  balance sheet items, and off-balance sheet exposures. Data must meet FRB validation rules and quality standards.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 mb-1">Reporting Frequency</p>
                    <p className="text-base font-semibold text-slate-900">Daily</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 mb-1">Submission Deadline</p>
                    <p className="text-base font-semibold text-slate-900">T+1 12:00 PM ET</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-600 mb-1">Maturity Buckets</p>
                    <p className="text-base font-semibold text-slate-900">31 Time Bands</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Product ID or Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Sub-Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Counterparty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Maturity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Net Cash Flow</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">HQLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.product}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{item.sub_product || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {item.counterparty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.maturity_bucket}</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(item.amount || 0)}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-semibold ${
                            ((item.projected_inflow || 0) - (item.projected_outflow || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency((item.projected_inflow || 0) - (item.projected_outflow || 0))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.is_hqla && (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredData.length === 0 && (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No products found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">FRB Rule</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Severity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Passed</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Failed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {qualityChecks.map((check) => (
                        <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            {getStatusIcon(check.status)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{check.check_name}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                              {check.check_category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{check.frb_rule_reference}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(check.severity)}`}>
                              {check.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                            {check.passed_products}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                            {check.failed_products}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {qualityChecks.length === 0 && (
                  <div className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No quality checks available.</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
