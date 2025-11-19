import { X, CheckCircle, XCircle, AlertTriangle, Info, Database, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DataQualityCheckModalProps {
  metricName: string;
  dataSource: string;
  onClose: () => void;
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
  connection_status: string;
}

export function DataQualityCheckModal({
  metricName,
  dataSource,
  onClose
}: DataQualityCheckModalProps) {
  const { user } = useAuth();
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQualityData();
  }, [dataSource]);

  const loadQualityData = async () => {
    

    try {
      const [checksResult, feedsResult] = await Promise.all([
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
          .ilike('feed_name', `%${dataSource}%`)
          .order('last_run_at', { ascending: false })
          .limit(5)
      ]);

      if (checksResult.error) throw checksResult.error;
      if (feedsResult.error) throw feedsResult.error;

      setQualityChecks(checksResult.data || []);
      setDataFeeds(feedsResult.data || []);
    } catch (error) {
      console.error('Error loading quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCheckTypeInfo = (checkType: string) => {
    const types: Record<string, { label: string; description: string; color: string }> = {
      'completeness': {
        label: 'Completeness Check',
        description: 'Validates that required fields are populated and not null',
        color: 'bg-blue-100 text-blue-700 border-blue-300'
      },
      'accuracy': {
        label: 'Accuracy Check',
        description: 'Ensures data values are correct and match expected patterns',
        color: 'bg-green-100 text-green-700 border-green-300'
      },
      'consistency': {
        label: 'Consistency Check',
        description: 'Verifies data consistency across related tables and fields',
        color: 'bg-purple-100 text-purple-700 border-purple-300'
      },
      'timeliness': {
        label: 'Timeliness Check',
        description: 'Checks if data is fresh and updated within expected timeframes',
        color: 'bg-amber-100 text-amber-700 border-amber-300'
      },
      'uniqueness': {
        label: 'Uniqueness Check',
        description: 'Validates that records do not contain duplicates',
        color: 'bg-cyan-100 text-cyan-700 border-cyan-300'
      },
      'validity': {
        label: 'Validity Check',
        description: 'Ensures values conform to defined business rules and constraints',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
      },
      'variance': {
        label: 'Variance Analysis',
        description: 'Detects unusual changes or anomalies in input values',
        color: 'bg-rose-100 text-rose-700 border-rose-300'
      }
    };

    return types[checkType] || {
      label: checkType,
      description: 'Data quality validation',
      color: 'bg-slate-100 text-slate-700 border-slate-300'
    };
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculatePassRate = (check: QualityCheck) => {
    if (check.total_records === 0) return 0;
    return ((check.passed_records / check.total_records) * 100).toFixed(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Data Quality & Feeds</h2>
            <p className="text-sm text-green-100 mt-1">{metricName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading quality data...</div>
          ) : (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Data Feeds
                </h3>

                {dataFeeds.length === 0 ? (
                  <div className="bg-slate-50 rounded-lg p-8 text-center">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No data feeds configured for this metric</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dataFeeds.map((feed) => (
                      <div
                        key={feed.id}
                        className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">{feed.feed_name}</h4>
                            <p className="text-sm text-slate-600 mt-1">{feed.source_system}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              feed.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : feed.status === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {feed.status.toUpperCase()}
                            </span>
                            {feed.is_stale && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700">
                                STALE
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Records Loaded</p>
                            <p className="font-semibold text-slate-900">{feed.records_loaded.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Errors</p>
                            <p className="font-semibold text-slate-900">{feed.error_count}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Last Run</p>
                            <p className="font-semibold text-slate-900 text-xs">{formatTimestamp(feed.last_run_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Quality Checks
                </h3>

                {qualityChecks.length === 0 ? (
                  <div className="bg-slate-50 rounded-lg p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No quality checks configured for this metric</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {qualityChecks.map((check) => {
                      const typeInfo = getCheckTypeInfo(check.check_type);
                      const passRate = calculatePassRate(check);

                      return (
                        <div
                          key={check.id}
                          className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {getStatusIcon(check.status)}
                                  <h4 className="font-semibold text-slate-900">{check.check_name}</h4>
                                </div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${
                                  parseFloat(passRate) >= 95
                                    ? 'text-green-600'
                                    : parseFloat(passRate) >= 80
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                }`}>
                                  {passRate}%
                                </div>
                                <p className="text-xs text-slate-500">Pass Rate</p>
                              </div>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3 mb-3">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-700">{typeInfo.description}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500">Total Records</p>
                                <p className="font-semibold text-slate-900">{check.total_records.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Passed</p>
                                <p className="font-semibold text-green-600">{check.passed_records.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Failed</p>
                                <p className="font-semibold text-red-600">{check.failed_records.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Execution Time</p>
                                <p className="font-semibold text-slate-900">{check.execution_time_ms}ms</p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                              Last run: {formatTimestamp(check.last_run_at)}
                            </div>

                            {check.error_message && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{check.error_message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
