import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ValidationExecution {
  id: string;
  submission_id: string;
  validation_rule_id: string | null;
  rule_name: string;
  rule_category: string;
  execution_timestamp: string;
  total_rows_checked: number;
  rows_passed: number;
  rows_failed: number;
  execution_status: string;
  execution_time_ms: number;
  notes: string | null;
}

interface ValidationRuleExecutionsProps {
  submissionId: string;
}

export function ValidationRuleExecutions({ submissionId }: ValidationRuleExecutionsProps) {
  const [executions, setExecutions] = useState<ValidationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadExecutions();
  }, [submissionId]);

  const loadExecutions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fr2052a_validation_executions')
      .select('*')
      .eq('submission_id', submissionId)
      .order('execution_timestamp', { ascending: false });

    if (data) setExecutions(data);
    setLoading(false);
  };

  const getStatusIcon = (execution: ValidationExecution) => {
    if (execution.rows_failed === 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (execution.rows_failed > 0 && execution.rows_passed > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getPassRate = (execution: ValidationExecution) => {
    if (execution.total_rows_checked === 0) return 0;
    return (execution.rows_passed / execution.total_rows_checked) * 100;
  };

  const getCategoryStats = () => {
    const stats: Record<string, { total: number; passed: number; failed: number }> = {};

    executions.forEach(exec => {
      if (!stats[exec.rule_category]) {
        stats[exec.rule_category] = { total: 0, passed: 0, failed: 0 };
      }
      stats[exec.rule_category].total++;
      if (exec.rows_failed === 0) {
        stats[exec.rule_category].passed++;
      } else {
        stats[exec.rule_category].failed++;
      }
    });

    return stats;
  };

  const filteredExecutions = selectedCategory
    ? executions.filter(e => e.rule_category === selectedCategory)
    : executions;

  const categoryStats = getCategoryStats();
  const categories = Object.keys(categoryStats);

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading validation executions...</div>;
  }

  if (executions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Validation Executions Found</h3>
        <p className="text-sm text-slate-600">
          Validation rules have not been executed for this submission
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Rules Executed</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{executions.length}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rules Passed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {executions.filter(e => e.rows_failed === 0).length}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rules with Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {executions.filter(e => e.rows_failed > 0).length}
              </p>
            </div>
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Execution Time</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {Math.round(executions.reduce((sum, e) => sum + e.execution_time_ms, 0) / executions.length)}ms
              </p>
            </div>
            <Clock className="h-10 w-10 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({executions.length})
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category.replace(/_/g, ' ')} ({categoryStats[category].total})
            </button>
          ))}
        </div>
      </div>

      {/* Execution Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Validation Rule Executions
            {selectedCategory && ` - ${selectedCategory.replace(/_/g, ' ')}`}
          </h3>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredExecutions.map((execution) => (
            <div key={execution.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(execution)}
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-900 mb-1">
                      {execution.rule_name}
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Category: <span className="font-medium">{execution.rule_category.replace(/_/g, ' ')}</span>
                    </p>

                    <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                      <div>
                        <p className="text-slate-600">Total Rows Checked</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {execution.total_rows_checked.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Rows Passed</p>
                        <p className="text-lg font-semibold text-green-600">
                          {execution.rows_passed.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Rows Failed</p>
                        <p className="text-lg font-semibold text-red-600">
                          {execution.rows_failed.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Pass Rate</p>
                        <p className={`text-lg font-semibold ${
                          getPassRate(execution) === 100 ? 'text-green-600' :
                          getPassRate(execution) >= 95 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {getPassRate(execution).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Pass Rate Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${
                          getPassRate(execution) === 100 ? 'bg-green-600' :
                          getPassRate(execution) >= 95 ? 'bg-yellow-500' : 'bg-red-600'
                        }`}
                        style={{ width: `${getPassRate(execution)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Execution Time: {execution.execution_time_ms}ms
                      </span>
                      <span>
                        Executed: {new Date(execution.execution_timestamp).toLocaleString()}
                      </span>
                    </div>

                    {execution.notes && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-900">{execution.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
