import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  GitBranch,
  X
} from 'lucide-react';

interface QualityCheck {
  id: string;
  check_name: string;
  check_type: string;
  data_source: string;
  status: string;
  total_records: number;
  passed_records: number;
  failed_records: number;
  execution_time_ms: number;
  last_run_at: string;
}

interface DataFeed {
  id: string;
  feed_name: string;
  feed_type: string;
  source_system: string;
  status: string;
  last_run_at: string;
  records_loaded: number;
  is_stale: boolean;
}

interface LineageNode {
  id: string;
  source_table: string;
  target_table: string;
  transformation_type: string;
  is_critical: boolean;
}

export function DataQualityDashboard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [lineageNodes, setLineageNodes] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'checks' | 'feeds' | 'lineage'>('checks');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    

    const [checksResult, feedsResult, lineageResult] = await Promise.all([
      supabase
        .from('data_quality_checks')
        .select('*')
        .is('user_id', null)
        .order('last_run_at', { ascending: false })
        .limit(20),
      supabase
        .from('data_feeds')
        .select('*')
        .is('user_id', null)
        .order('last_run_at', { ascending: false }),
      supabase
        .from('data_lineage')
        .select('*')
        .is('user_id', null)
        .order('dependency_level', { ascending: true })
    ]);

    if (checksResult.data) setQualityChecks(checksResult.data);
    if (feedsResult.data) setDataFeeds(feedsResult.data);
    if (lineageResult.data) setLineageNodes(lineageResult.data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
      case 'stale':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const passRate = qualityChecks.length > 0
    ? (qualityChecks.filter(c => c.status === 'passed').length / qualityChecks.length) * 100
    : 0;

  const activeFeeds = dataFeeds.filter(f => f.status === 'active').length;
  const staleFeeds = dataFeeds.filter(f => f.is_stale).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <p className="text-slate-600">Loading data quality metrics...</p>
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
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Data Quality Dashboard</h2>
                <p className="text-sm text-slate-600">Input/Output validation, feeds, and lineage</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Pass Rate</p>
                  <p className="text-3xl font-bold text-green-900">{passRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Active Feeds</p>
                  <p className="text-3xl font-bold text-blue-900">{activeFeeds}/{dataFeeds.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Stale Feeds</p>
                  <p className="text-3xl font-bold text-amber-900">{staleFeeds}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('checks')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'checks'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Quality Checks
            </button>
            <button
              onClick={() => setActiveTab('feeds')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'feeds'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Data Feeds
            </button>
            <button
              onClick={() => setActiveTab('lineage')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'lineage'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Data Lineage
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'checks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Data Quality Checks</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Check
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Source</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Records</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Pass Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Last Run</th>
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(check.check_type)}`}>
                              {check.check_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{check.data_source}</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-900">{check.total_records.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-semibold ${
                              check.total_records > 0 && (check.passed_records / check.total_records) >= 0.95
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {check.total_records > 0 ? ((check.passed_records / check.total_records) * 100).toFixed(1) : 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(check.last_run_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {qualityChecks.length === 0 && (
                  <div className="p-12 text-center">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No quality checks found. Add your first check to start monitoring data quality.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feeds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Data Feeds</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Feed
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataFeeds.map((feed) => (
                  <div key={feed.id} className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-emerald-500 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{feed.feed_name}</h4>
                        <p className="text-xs text-slate-600">{feed.source_system}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feed.status)}`}>
                        {feed.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Type:</span>
                        <span className="font-medium text-slate-900">{feed.feed_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Records:</span>
                        <span className="font-medium text-slate-900">{feed.records_loaded.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Last Run:</span>
                        <span className="font-medium text-slate-900">{formatDate(feed.last_run_at)}</span>
                      </div>
                      {feed.is_stale && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="w-3 h-3" />
                            Feed is stale
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {dataFeeds.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No data feeds configured. Add your first feed to start monitoring.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lineage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Data Lineage</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Mapping
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="space-y-6">
                  {lineageNodes.map((node, index) => (
                    <div key={node.id} className="flex items-center gap-4">
                      <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="w-4 h-4 text-blue-600" />
                          <p className="font-semibold text-slate-900">{node.source_table}</p>
                        </div>
                        <p className="text-xs text-slate-600">Source</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <GitBranch className="w-6 h-6 text-slate-400" />
                        <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                          node.is_critical ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {node.transformation_type}
                        </span>
                      </div>

                      <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <p className="font-semibold text-slate-900">{node.target_table}</p>
                        </div>
                        <p className="text-xs text-slate-600">Target</p>
                      </div>
                    </div>
                  ))}
                </div>

                {lineageNodes.length === 0 && (
                  <div className="p-12 text-center">
                    <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No data lineage mappings found. Add mappings to visualize data flow.</p>
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
