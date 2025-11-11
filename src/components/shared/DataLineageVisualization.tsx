import { X, Database, ArrowRight, GitBranch } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DataLineageVisualizationProps {
  metricName: string;
  targetTable: string;
  targetColumn: string;
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

export function DataLineageVisualization({
  metricName,
  targetTable,
  targetColumn,
  onClose
}: DataLineageVisualizationProps) {
  const { user } = useAuth();
  const [lineageData, setLineageData] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLineageData();
  }, [targetTable, targetColumn]);

  const loadLineageData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('data_lineage')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_table', targetTable)
        .eq('target_column', targetColumn)
        .order('dependency_level', { ascending: true });

      if (error) throw error;
      setLineageData(data || []);
    } catch (error) {
      console.error('Error loading lineage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByLevel = lineageData.reduce((acc, node) => {
    const level = node.dependency_level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(node);
    return acc;
  }, {} as Record<number, LineageNode[]>);

  const levels = Object.keys(groupedByLevel).map(Number).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Data Lineage</h2>
            <p className="text-sm text-blue-100 mt-1">{metricName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading lineage data...</div>
          ) : lineageData.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No lineage data available for this metric</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Target Metric</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-700"><span className="font-medium">Table:</span> {targetTable}</p>
                      <p className="text-slate-700"><span className="font-medium">Column:</span> {targetColumn}</p>
                    </div>
                  </div>
                </div>
              </div>

              {levels.map((level, levelIndex) => (
                <div key={level} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white text-sm font-bold">
                      {level}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Dependency Level {level}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                    {groupedByLevel[level].map((node) => (
                      <div
                        key={node.id}
                        className={`relative rounded-lg border-2 p-4 ${
                          node.is_critical
                            ? 'bg-red-50 border-red-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {node.is_critical && (
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
                              CRITICAL
                            </span>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 mb-1">SOURCE</p>
                                <p className="text-sm font-medium text-slate-900">{node.source_system}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                  {node.source_table}.{node.source_column}
                                </p>
                              </div>
                            </div>

                            <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />

                            <div className="flex-1">
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 mb-1">TARGET</p>
                                <p className="text-sm font-medium text-slate-900">{node.target_system}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                  {node.target_table}.{node.target_column}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                node.transformation_type === 'direct'
                                  ? 'bg-green-100 text-green-700'
                                  : node.transformation_type === 'calculated'
                                  ? 'bg-blue-100 text-blue-700'
                                  : node.transformation_type === 'aggregated'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {node.transformation_type.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">{node.transformation_rule}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {levelIndex < levels.length - 1 && (
                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-slate-300"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
              <span className="text-slate-600">Direct Mapping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-slate-600">Calculated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-slate-600">Aggregated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div>
              <span className="text-slate-600">Derived</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-50 border-2 border-red-300"></div>
              <span className="text-slate-600">Critical Path</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
