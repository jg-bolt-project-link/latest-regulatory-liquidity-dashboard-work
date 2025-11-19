import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  Clock,
  GitBranch,
  X,
  Eye
} from 'lucide-react';
import { DataLineageVisualization } from './shared/DataLineageVisualization';

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
  error_count: number;
  is_stale: boolean;
}

interface LineageNode {
  id: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  transformation_type: string;
  is_critical: boolean;
  dependency_level: number;
}

interface DataQualityDashboardNewProps {
  onClose: () => void;
}

export function DataQualityDashboardNew({ onClose }: DataQualityDashboardNewProps) {
  const { user } = useAuth();
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [lineageNodes, setLineageNodes] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checks' | 'feeds' | 'lineage'>('overview');
  const [selectedLineage, setSelectedLineage] = useState<{ table: string; column: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    

    try {
      const [checksResult, feedsResult, lineageResult] = await Promise.all([
        supabase
          .from('data_quality_checks')
          .select('*')
          .is('user_id', null)
          .order('last_run_at', { ascending: false }),
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
          .limit(50)
      ]);

      if (checksResult.data) setQualityChecks(checksResult.data);
      if (feedsResult.data) setDataFeeds(feedsResult.data);
      if (lineageResult.data) setLineageNodes(lineageResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const passedChecks = qualityChecks.filter(c => c.status === 'passed').length;
  const failedChecks = qualityChecks.filter(c => c.status === 'failed').length;
  const warningChecks = qualityChecks.filter(c => c.status === 'warning').length;
  const passRate = qualityChecks.length > 0 ? (passedChecks / qualityChecks.length) * 100 : 0;

  const activeFeeds = dataFeeds.filter(f => f.status === 'active').length;
  const errorFeeds = dataFeeds.filter(f => f.status === 'error').length;
  const staleFeeds = dataFeeds.filter(f => f.is_stale).length;

  const criticalLineage = lineageNodes.filter(n => n.is_critical).length;
  const totalRecordsProcessed = dataFeeds.reduce((sum, f) => sum + f.records_loaded, 0);

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const groupedLineage = lineageNodes.reduce((acc, node) => {
    const key = `${node.target_table}.${node.target_column}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(node);
    return acc;
  }, {} as Record<string, LineageNode[]>);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Data Quality Dashboard</h2>
                <p className="text-sm text-blue-100 mt-0.5">Monitoring data feeds, quality checks, and lineage</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-6">
            <div className="flex gap-1">
              {(['overview', 'checks', 'feeds', 'lineage'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-slate-600">Loading data quality metrics...</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <span className="text-3xl font-bold text-green-900">{passRate.toFixed(0)}%</span>
                        </div>
                        <p className="text-sm font-medium text-green-900">Data Quality Score</p>
                        <p className="text-xs text-green-700 mt-1">{passedChecks} of {qualityChecks.length} checks passed</p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <Database className="w-8 h-8 text-blue-600" />
                          <span className="text-3xl font-bold text-blue-900">{dataFeeds.length}</span>
                        </div>
                        <p className="text-sm font-medium text-blue-900">Active Data Feeds</p>
                        <p className="text-xs text-blue-700 mt-1">{activeFeeds} running, {staleFeeds} stale</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <GitBranch className="w-8 h-8 text-purple-600" />
                          <span className="text-3xl font-bold text-purple-900">{lineageNodes.length}</span>
                        </div>
                        <p className="text-sm font-medium text-purple-900">Lineage Mappings</p>
                        <p className="text-xs text-purple-700 mt-1">{criticalLineage} critical paths</p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                        <div className="flex items-center justify-between mb-3">
                          <Activity className="w-8 h-8 text-amber-600" />
                          <span className="text-3xl font-bold text-amber-900">{(totalRecordsProcessed / 1000000).toFixed(1)}M</span>
                        </div>
                        <p className="text-sm font-medium text-amber-900">Records Processed</p>
                        <p className="text-xs text-amber-700 mt-1">Across all feeds</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quality Check Status</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-slate-900">Passed</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{passedChecks}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-amber-600" />
                              <span className="font-medium text-slate-900">Warnings</span>
                            </div>
                            <span className="text-2xl font-bold text-amber-600">{warningChecks}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-slate-900">Failed</span>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{failedChecks}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Feed Health</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-slate-900">Active</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{activeFeeds}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-amber-600" />
                              <span className="font-medium text-slate-900">Stale</span>
                            </div>
                            <span className="text-2xl font-bold text-amber-600">{staleFeeds}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-slate-900">Errors</span>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{errorFeeds}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'checks' && (
                  <div className="space-y-4">
                    {qualityChecks.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No quality checks configured</p>
                      </div>
                    ) : (
                      qualityChecks.map((check) => {
                        const passRate = check.total_records > 0
                          ? ((check.passed_records / check.total_records) * 100).toFixed(1)
                          : '0';

                        return (
                          <div
                            key={check.id}
                            className="bg-white rounded-lg border-2 border-slate-200 p-5"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-slate-900 text-lg">{check.check_name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                    {check.check_type}
                                  </span>
                                  <span className="text-sm text-slate-600">{check.data_source}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-3xl font-bold ${
                                  parseFloat(passRate) >= 95
                                    ? 'text-green-600'
                                    : parseFloat(passRate) >= 80
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                }`}>
                                  {passRate}%
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Pass Rate</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-900">{check.total_records.toLocaleString()}</p>
                                <p className="text-xs text-slate-600 mt-1">Total</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{check.passed_records.toLocaleString()}</p>
                                <p className="text-xs text-green-700 mt-1">Passed</p>
                              </div>
                              <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{check.failed_records.toLocaleString()}</p>
                                <p className="text-xs text-red-700 mt-1">Failed</p>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{check.execution_time_ms}</p>
                                <p className="text-xs text-blue-700 mt-1">ms</p>
                              </div>
                            </div>

                            <div className="text-sm text-slate-500 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Last run: {formatTimestamp(check.last_run_at)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'feeds' && (
                  <div className="space-y-4">
                    {dataFeeds.length === 0 ? (
                      <div className="text-center py-12">
                        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No data feeds configured</p>
                      </div>
                    ) : (
                      dataFeeds.map((feed) => (
                        <div
                          key={feed.id}
                          className="bg-white rounded-lg border-2 border-slate-200 p-5"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-slate-900 text-lg">{feed.feed_name}</h4>
                              <p className="text-sm text-slate-600 mt-1">{feed.source_system}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                feed.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : feed.status === 'error'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {feed.status.toUpperCase()}
                              </span>
                              {feed.is_stale && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                  STALE
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{feed.records_loaded.toLocaleString()}</p>
                              <p className="text-xs text-blue-700 mt-1">Records Loaded</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <p className="text-2xl font-bold text-red-600">{feed.error_count}</p>
                              <p className="text-xs text-red-700 mt-1">Errors</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <p className="text-sm font-bold text-slate-900">{formatTimestamp(feed.last_run_at)}</p>
                              <p className="text-xs text-slate-600 mt-1">Last Run</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'lineage' && (
                  <div className="space-y-4">
                    {Object.keys(groupedLineage).length === 0 ? (
                      <div className="text-center py-12">
                        <GitBranch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No lineage data available</p>
                      </div>
                    ) : (
                      Object.entries(groupedLineage).map(([key, nodes]) => (
                        <div
                          key={key}
                          className="bg-white rounded-lg border-2 border-slate-200 p-5"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-slate-900 text-lg">{key}</h4>
                              <p className="text-sm text-slate-600 mt-1">{nodes.length} source mappings</p>
                            </div>
                            <button
                              onClick={() => {
                                const [table, column] = key.split('.');
                                setSelectedLineage({ table, column, name: key });
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View Lineage
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {nodes.slice(0, 4).map((node) => (
                              <div
                                key={node.id}
                                className={`p-3 rounded-lg border ${
                                  node.is_critical
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-slate-600">
                                    {node.source_table}.{node.source_column}
                                  </span>
                                  {node.is_critical && (
                                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                  node.transformation_type === 'direct'
                                    ? 'bg-green-100 text-green-700'
                                    : node.transformation_type === 'calculated'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {node.transformation_type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedLineage && (
        <DataLineageVisualization
          metricName={selectedLineage.name}
          targetTable={selectedLineage.table}
          targetColumn={selectedLineage.column}
          onClose={() => setSelectedLineage(null)}
        />
      )}
    </>
  );
}
