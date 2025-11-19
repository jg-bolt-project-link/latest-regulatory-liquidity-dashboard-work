import { X, Eye, Database, CheckCircle, AlertTriangle, GitBranch, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MetricDetailsModalProps {
  metricName: string;
  metricValue: string | number;
  targetTable: string;
  targetColumn: string;
  dataSource: string;
  onClose: () => void;
}

interface LineageNode {
  id: string;
  source_system: string;
  source_table: string;
  source_column: string;
  target_system: string;
  target_table: string;
  target_column: string;
  transformation_rule: string;
  transformation_type: string;
  dependency_level: number;
  is_critical: boolean;
}

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
  error_message: string | null;
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

interface PredecessorData {
  table: string;
  column: string;
  system: string;
  transformationType: string;
  transformationRule: string;
  isCritical: boolean;
  dependencyLevel: number;
}

export function MetricDetailsModal({
  metricName,
  metricValue,
  targetTable,
  targetColumn,
  dataSource,
  onClose
}: MetricDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quality' | 'feeds' | 'lineage'>('lineage');
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [lineageNodes, setLineageNodes] = useState<LineageNode[]>([]);
  const [predecessors, setPredecessors] = useState<PredecessorData[]>([]);
  const [expandedPredecessors, setExpandedPredecessors] = useState<Set<string>>(new Set());
  const [selectedPredecessor, setSelectedPredecessor] = useState<PredecessorData | null>(null);

  useEffect(() => {
    loadAllData();
  }, [targetTable, targetColumn]);

  const loadAllData = async () => {
    

    try {
      const [checksResult, feedsResult, lineageResult] = await Promise.all([
        supabase
          .from('data_quality_checks')
          .select('*')
          .is('user_id', null)
          .eq('data_source', dataSource)
          .order('last_run_at', { ascending: false })
          .limit(10),
        supabase
          .from('data_feeds')
          .select('*')
          .is('user_id', null)
          .ilike('source_system', `%${dataSource}%`)
          .order('last_run_at', { ascending: false })
          .limit(5),
        supabase
          .from('data_lineage')
          .select('*')
          .is('user_id', null)
          .eq('target_table', targetTable)
          .eq('target_column', targetColumn)
          .order('dependency_level', { ascending: true })
      ]);

      if (checksResult.error) throw checksResult.error;
      if (feedsResult.error) throw feedsResult.error;
      if (lineageResult.error) throw lineageResult.error;

      setQualityChecks(checksResult.data || []);
      setDataFeeds(feedsResult.data || []);
      setLineageNodes(lineageResult.data || []);

      const predecessorData: PredecessorData[] = (lineageResult.data || []).map(node => ({
        table: node.source_table,
        column: node.source_column,
        system: node.source_system,
        transformationType: node.transformation_type,
        transformationRule: node.transformation_rule,
        isCritical: node.is_critical,
        dependencyLevel: node.dependency_level
      }));
      setPredecessors(predecessorData);
    } catch (error) {
      console.error('Error loading metric details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const calculatePassRate = (check: QualityCheck) => {
    if (check.total_records === 0) return 0;
    return ((check.passed_records / check.total_records) * 100).toFixed(1);
  };

  const getTransformationColor = (type: string) => {
    switch (type) {
      case 'direct':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'calculated':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'aggregated':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'derived':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handlePredecessorClick = (predecessor: PredecessorData) => {
    setSelectedPredecessor(predecessor);
  };

  const togglePredecessorExpansion = (key: string) => {
    setExpandedPredecessors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{metricName}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold text-white">{metricValue}</span>
                  <span className="px-3 py-1 bg-blue-500/50 rounded-full text-sm text-white">
                    {targetTable}.{targetColumn}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              {(['lineage', 'quality', 'feeds'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
                  }`}
                >
                  {tab === 'lineage' && 'Data Lineage'}
                  {tab === 'quality' && 'Quality Checks'}
                  {tab === 'feeds' && 'Data Feeds'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-600">Loading metric details...</div>
            ) : (
              <>
                {activeTab === 'lineage' && (
                  <div className="space-y-6">
                    {predecessors.length === 0 ? (
                      <div className="text-center py-12">
                        <GitBranch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No predecessor data found</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">Current Metric</h3>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-700"><span className="font-medium">Table:</span> {targetTable}</p>
                            <p className="text-slate-700"><span className="font-medium">Column:</span> {targetColumn}</p>
                            <p className="text-slate-700"><span className="font-medium">Value:</span> {metricValue}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Predecessor Data</h3>
                          <div className="space-y-3">
                            {predecessors.map((pred, index) => {
                              const key = `${pred.table}.${pred.column}`;
                              const isExpanded = expandedPredecessors.has(key);

                              return (
                                <div
                                  key={index}
                                  className={`border-2 rounded-lg overflow-hidden ${
                                    pred.isCritical
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3 flex-1">
                                        <button
                                          onClick={() => togglePredecessorExpansion(key)}
                                          className="p-1 hover:bg-slate-100 rounded"
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-slate-600" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                          )}
                                        </button>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-900">
                                              {pred.table}.{pred.column}
                                            </span>
                                            {pred.isCritical && (
                                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
                                                CRITICAL
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-slate-600">{pred.system}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTransformationColor(pred.transformationType)}`}>
                                          {pred.transformationType.toUpperCase()}
                                        </span>
                                        <button
                                          onClick={() => handlePredecessorClick(pred)}
                                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                          title="View details for this predecessor"
                                        >
                                          <Eye className="w-4 h-4 text-blue-600" />
                                        </button>
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                          <p className="text-xs font-semibold text-slate-500 mb-1">TRANSFORMATION RULE</p>
                                          <p className="text-sm text-slate-700">{pred.transformationRule}</p>
                                        </div>
                                        <div className="mt-3 text-xs text-slate-600">
                                          <span className="font-medium">Dependency Level:</span> {pred.dependencyLevel}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-sm text-slate-700">
                            <strong>Note:</strong> Click the <Eye className="w-4 h-4 inline mx-1 text-blue-600" /> icon next to any predecessor to view its own data quality, feeds, and lineage information.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'quality' && (
                  <div className="space-y-4">
                    {qualityChecks.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No quality checks configured</p>
                      </div>
                    ) : (
                      qualityChecks.map((check) => {
                        const passRate = calculatePassRate(check);

                        return (
                          <div
                            key={check.id}
                            className="bg-white rounded-lg border-2 border-slate-200 p-5"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-slate-900 text-lg">{check.check_name}</h4>
                                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                  {check.check_type}
                                </span>
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

                            <div className="text-sm text-slate-500">
                              Last run: {formatTimestamp(check.last_run_at)}
                            </div>

                            {check.error_message && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{check.error_message}</p>
                              </div>
                            )}
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
              </>
            )}
          </div>
        </div>
      </div>

      {selectedPredecessor && (
        <MetricDetailsModal
          metricName={`${selectedPredecessor.table}.${selectedPredecessor.column}`}
          metricValue="Predecessor Data"
          targetTable={selectedPredecessor.table}
          targetColumn={selectedPredecessor.column}
          dataSource={selectedPredecessor.system}
          onClose={() => setSelectedPredecessor(null)}
        />
      )}
    </>
  );
}
