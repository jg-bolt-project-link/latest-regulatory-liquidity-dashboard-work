import { useState, useEffect } from 'react';
import { FileUp, CheckCircle, XCircle, AlertTriangle, Database, FileText, TrendingUp, Calculator, BarChart3, Eye, EyeOff, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { seedFR2052aWithCalculations } from '../utils/seedFR2052aWithCalculations';
import { EnhancedLCRValidationScreen } from './validation/EnhancedLCRValidationScreen';
import { NSFRValidationScreen } from './validation/NSFRValidationScreen';
import { ValidationRuleExecutions } from './validation/ValidationRuleExecutions';

interface ValidationRule {
  id: string;
  rule_category: string;
  rule_name: string;
  field_name: string | null;
  validation_logic: string;
  is_active: boolean;
}

interface FileSubmission {
  id: string;
  file_name: string;
  upload_timestamp: string;
  reporting_entity: string;
  reporting_period: string;
  submission_status: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  data_validation_executed?: boolean;
  lcr_validation_executed?: boolean;
  nsfr_validation_executed?: boolean;
}

interface ValidationError {
  id: string;
  error_type: string;
  error_message: string;
  field_name: string | null;
  severity: string;
  created_at: string;
}

export function FR2052aValidation() {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [submissions, setSubmissions] = useState<FileSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<FileSubmission | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'submissions' | 'errors' | 'lcr' | 'nsfr' | 'executions'>('overview');
  const [dataSeeded, setDataSeeded] = useState(false);
  const [isExecutingValidation, setIsExecutingValidation] = useState(false);
  const [executionStep, setExecutionStep] = useState('');
  const [executingSubmissionId, setExecutingSubmissionId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    fileName: true,
    entity: true,
    period: true,
    status: true,
    rows: true,
    errors: true,
    timestamp: false,
    type: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: rules } = await supabase
      .from('fr2052a_validation_rules')
      .select('*')
      .order('rule_category', { ascending: true });

    const { data: subs } = await supabase
      .from('fr2052a_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get all legal entities for lookup
    const { data: legalEntities } = await supabase
      .from('legal_entities')
      .select('id, entity_code, entity_name')
      .is('user_id', null);

    const entityMap = new Map(legalEntities?.map(e => [e.id, e]) || []);

    if (rules) setValidationRules(rules);
    if (subs) {
      // Batch query all row counts by reporting period (much faster than individual queries)
      const periods = [...new Set(subs.map(s => s.reporting_period))];
      const rowCountsPromises = periods.map(async (period) => {
        const { count } = await supabase
          .from('fr2052a_data_rows')
          .select('*', { count: 'exact', head: true })
          .eq('report_date', period)
          .is('user_id', null);
        return { period, count: count || 0 };
      });
      const rowCountsResults = await Promise.all(rowCountsPromises);
      const rowCountsByPeriod = new Map(rowCountsResults.map(r => [r.period, r.count]));

      // Batch query all error counts by submission (much faster than individual queries)
      const submissionIds = subs.map(s => s.id);
      const { data: errorCounts } = await supabase
        .from('fr2052a_validation_errors')
        .select('submission_id')
        .in('submission_id', submissionIds);

      // Count errors per submission
      const errorCountsBySubmission = new Map<string, number>();
      errorCounts?.forEach(error => {
        const current = errorCountsBySubmission.get(error.submission_id) || 0;
        errorCountsBySubmission.set(error.submission_id, current + 1);
      });

      // Check validation status for each submission
      const validationStatusPromises = subs.map(async (s) => {
        const [dataVal, lcrVal, nsfrVal] = await Promise.all([
          supabase.from('fr2052a_validation_executions').select('id').eq('submission_id', s.id).limit(1),
          supabase.from('lcr_calculation_validations').select('id').eq('submission_id', s.id).limit(1),
          supabase.from('nsfr_calculation_validations').select('id').eq('submission_id', s.id).limit(1)
        ]);

        return {
          submissionId: s.id,
          data_validation_executed: (dataVal.data?.length || 0) > 0,
          lcr_validation_executed: (lcrVal.data?.length || 0) > 0,
          nsfr_validation_executed: (nsfrVal.data?.length || 0) > 0
        };
      });

      const validationStatuses = await Promise.all(validationStatusPromises);
      const validationStatusMap = new Map(validationStatuses.map(v => [v.submissionId, v]));

      // Format submissions with pre-fetched counts and validation status
      const formattedSubs = subs.map(s => {
        const totalRows = rowCountsByPeriod.get(s.reporting_period) || 0;
        const errorCount = errorCountsBySubmission.get(s.id) || 0;
        const valStatus = validationStatusMap.get(s.id);

        // Look up entity name from map
        const entity = entityMap.get(s.legal_entity_id);
        const entityName = entity ? entity.entity_code : (s.legal_entity_id === 'all_entities' ? 'All Entities' : s.legal_entity_id);

        // Create descriptive file name with entity code for clarity
        const fileName = entity
          ? `FR2052a_${s.reporting_period}_${entity.entity_code}`
          : `FR2052a_${s.reporting_period}`;

        return {
          id: s.id,
          file_name: fileName,
          upload_timestamp: s.created_at,
          reporting_entity: entityName,
          reporting_period: s.reporting_period,
          submission_status: s.submission_status,
          total_rows: totalRows,
          valid_rows: totalRows - errorCount,
          error_rows: errorCount,
          data_validation_executed: valStatus?.data_validation_executed || false,
          lcr_validation_executed: valStatus?.lcr_validation_executed || false,
          nsfr_validation_executed: valStatus?.nsfr_validation_executed || false
        };
      });

      setSubmissions(formattedSubs);
    }

    setLoading(false);
  };

  const handleSeedData = async () => {
    setLoading(true);
    await seedFR2052aWithCalculations();
    await loadData();
    setDataSeeded(true);
  };

  const handleExecuteValidations = async (submissionId: string) => {
    setIsExecutingValidation(true);
    setExecutingSubmissionId(submissionId);
    setExecutionStep('Initializing validation execution...');

    try {
      const { executeValidationsForSubmission } = await import('../utils/executeValidations');

      setExecutionStep('[1/3] Executing FR2052a data validation...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI to update

      const result = await executeValidationsForSubmission(submissionId);

      setExecutionStep('[3/3] Validation complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload data to show updated statuses
      await loadData();

      // Show success message
      const message = `Validation Execution Complete!\n\n` +
        `FR2052a Data: ${result.steps.dataValidation.passed ? '✓ PASSED' : '✗ FAILED'}\n` +
        `  - Total Rows: ${result.steps.dataValidation.totalRows}\n` +
        `  - Valid Rows: ${result.steps.dataValidation.validRows}\n` +
        `  - Error Rows: ${result.steps.dataValidation.errorRows}\n\n` +
        `LCR Validation: ${result.steps.lcrValidation.executed ? (result.steps.lcrValidation.passed ? '✓ PASSED' : '⚠ FAILED') : '- N/A'}\n` +
        (result.steps.lcrValidation.executed ? `  - LCR Ratio: ${(result.steps.lcrValidation.ratio! * 100).toFixed(2)}%\n` : '') +
        `\nNSFR Validation: ${result.steps.nsfrValidation.executed ? (result.steps.nsfrValidation.passed ? '✓ PASSED' : '⚠ FAILED') : '- N/A'}\n` +
        (result.steps.nsfrValidation.executed ? `  - NSFR Ratio: ${(result.steps.nsfrValidation.ratio! * 100).toFixed(2)}%\n` : '');

      alert(message);

    } catch (error) {
      console.error('Validation execution failed:', error);
      alert(`Validation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    } finally {
      setIsExecutingValidation(false);
      setExecutingSubmissionId(null);
      setExecutionStep('');
    }
  };

  const loadErrors = async (submissionId: string) => {
    const { data } = await supabase
      .from('fr2052a_validation_errors')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false });

    if (data) setErrors(data);
  };

  const getRuleCategoryStats = () => {
    const categories = validationRules.reduce((acc, rule) => {
      acc[rule.rule_category] = (acc[rule.rule_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return categories;
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const validated = submissions.filter(s => s.submission_status === 'validated').length;
    const rejected = submissions.filter(s => s.submission_status === 'rejected').length;
    const pending = submissions.filter(s => s.submission_status === 'pending').length;

    return { total, validated, rejected, pending };
  };

  const categoryColors: Record<string, string> = {
    schema_validation: 'bg-blue-100 text-blue-800',
    enumeration: 'bg-purple-100 text-purple-800',
    legal_entity: 'bg-green-100 text-green-800',
    internal_transaction: 'bg-yellow-100 text-yellow-800',
    field_dependency: 'bg-orange-100 text-orange-800',
    cross_field: 'bg-red-100 text-red-800',
    duplicate: 'bg-pink-100 text-pink-800',
    data_type: 'bg-indigo-100 text-indigo-800',
    product_hierarchy: 'bg-teal-100 text-teal-800',
    submission_frequency: 'bg-cyan-100 text-cyan-800',
  };

  const renderOverview = () => {
    const categoryStats = getRuleCategoryStats();
    const submissionStats = getSubmissionStats();

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Rules</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{validationRules.length}</p>
              </div>
              <Database className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Submissions</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{submissionStats.total}</p>
              </div>
              <FileText className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Validated</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{submissionStats.validated}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{submissionStats.rejected}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Validation Rule Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(categoryStats).map(([category, count]) => (
              <div key={category} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-600 mt-1 capitalize">{category.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">FR 2052a Validation System</h3>
              <p className="text-sm text-slate-700 mb-4">
                This system implements the 10 core validation checks required for FR 2052a regulatory reporting compliance:
              </p>
              <ul className="text-sm text-slate-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Schema Validation:</strong> XML/XSD conformance checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Enumeration Validation:</strong> Field value against allowed lists</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Legal Entity Integrity:</strong> RSSD/LEI validation and consolidation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Internal Transaction Symmetry:</strong> Counterparty matching and flow verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>And 6 additional validation categories...</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!dataSeeded && validationRules.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Database className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Initialize Validation Data</h3>
            <p className="text-sm text-slate-600 mb-6">
              Load the initial validation rules, enumerations, and entity mappings to get started.
            </p>
            <button
              onClick={handleSeedData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seed Validation Data
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderRules = () => {
    const groupedRules = validationRules.reduce((acc, rule) => {
      if (!acc[rule.rule_category]) {
        acc[rule.rule_category] = [];
      }
      acc[rule.rule_category].push(rule);
      return acc;
    }, {} as Record<string, ValidationRule[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedRules).map(([category, rules]) => (
          <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 capitalize">
                {category.replace(/_/g, ' ')} ({rules.length} rules)
              </h3>
            </div>
            <div className="divide-y divide-slate-200">
              {rules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-base font-semibold text-slate-900">{rule.rule_name}</h4>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${categoryColors[rule.rule_category] || 'bg-slate-100 text-slate-800'}`}>
                      {rule.rule_category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {rule.field_name && (
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Field:</span> {rule.field_name}
                    </p>
                  )}
                  <p className="text-sm text-slate-700">{rule.validation_logic}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSubmissions = () => {
    if (submissions.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Submissions Yet</h3>
          <p className="text-sm text-slate-600">Upload FR 2052a files to begin validation</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {selectedSubmission && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Currently Viewing: {selectedSubmission.file_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    Period: {new Date(selectedSubmission.reporting_period).toLocaleDateString()} •
                    Status: {selectedSubmission.submission_status} •
                    {selectedSubmission.error_rows} errors
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Submissions ({submissions.length})</h3>
            <div className="relative">
              <button
                onClick={() => {
                  const dropdown = document.getElementById('column-dropdown');
                  if (dropdown) dropdown.classList.toggle('hidden');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                Columns
              </button>
              <div id="column-dropdown" className="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <div className="p-3 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 uppercase">Show/Hide Columns</p>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {[
                    { key: 'fileName', label: 'File Name' },
                    { key: 'entity', label: 'Entity' },
                    { key: 'period', label: 'Period' },
                    { key: 'status', label: 'Status' },
                    { key: 'rows', label: 'Total Rows' },
                    { key: 'errors', label: 'Errors' },
                    { key: 'timestamp', label: 'Upload Time' },
                    { key: 'type', label: 'Submission Type' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                        onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider w-32">
                Quick Actions
              </th>
              {visibleColumns.fileName && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[200px]">
                  File Name
                </th>
              )}
              {visibleColumns.entity && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[150px]">
                  Entity
                </th>
              )}
              {visibleColumns.period && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[120px]">
                  Period
                </th>
              )}
              {visibleColumns.status && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[120px]">
                  Status
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[280px]">
                Validation Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[140px]">
                Actions
              </th>
              {visibleColumns.rows && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[100px]">
                  Total Rows
                </th>
              )}
              {visibleColumns.errors && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[100px]">
                  Errors
                </th>
              )}
              {visibleColumns.timestamp && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[150px]">
                  Upload Time
                </th>
              )}
              {visibleColumns.type && (
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[150px]">
                  Type
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className={`hover:bg-slate-50 transition-colors ${
                  selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="sticky left-0 z-10 bg-white px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setActiveTab('executions');
                      }}
                      title="View Rule Executions"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        loadErrors(submission.id);
                        setActiveTab('errors');
                      }}
                      title="View Errors"
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setActiveTab('lcr');
                      }}
                      title="View LCR Validation"
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Calculator className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setActiveTab('nsfr');
                      }}
                      title="View NSFR Validation"
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                {visibleColumns.fileName && (
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    <div className="max-w-[200px] truncate" title={submission.file_name}>
                      {submission.file_name}
                    </div>
                  </td>
                )}
                {visibleColumns.entity && (
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <div className="max-w-[150px] truncate" title={submission.reporting_entity}>
                      {submission.reporting_entity}
                    </div>
                  </td>
                )}
                {visibleColumns.period && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(submission.reporting_period).toLocaleDateString()}
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      submission.submission_status === 'validated' ? 'bg-green-100 text-green-800' :
                      submission.submission_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      submission.submission_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.submission_status}
                    </span>
                  </td>
                )}
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600 w-16">Data:</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        submission.data_validation_executed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {submission.data_validation_executed ? '✓ Executed' : '⚠ Not Executed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600 w-16">LCR:</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        submission.lcr_validation_executed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {submission.lcr_validation_executed ? '✓ Executed' : '⚠ Not Executed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600 w-16">NSFR:</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        submission.nsfr_validation_executed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {submission.nsfr_validation_executed ? '✓ Executed' : '⚠ Not Executed'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleExecuteValidations(submission.id)}
                    disabled={isExecutingValidation && executingSubmissionId === submission.id}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isExecutingValidation && executingSubmissionId === submission.id
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isExecutingValidation && executingSubmissionId === submission.id
                      ? 'Executing...'
                      : submission.data_validation_executed && submission.lcr_validation_executed && submission.nsfr_validation_executed
                      ? 'Re-Execute'
                      : 'Execute Validations'
                    }
                  </button>
                </td>
                {visibleColumns.rows && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    {submission.total_rows.toLocaleString()}
                  </td>
                )}
                {visibleColumns.errors && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={submission.error_rows > 0 ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                      {submission.error_rows.toLocaleString()}
                    </span>
                  </td>
                )}
                {visibleColumns.timestamp && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(submission.upload_timestamp).toLocaleString()}
                  </td>
                )}
                {visibleColumns.type && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                      System Generated
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      </div>
    );
  };

  const renderErrors = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Error Details</h3>
            <div className="w-64">
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Submission</label>
              <select
                value={selectedSubmission?.id || ''}
                onChange={(e) => {
                  const submission = submissions.find(s => s.id === e.target.value);
                  if (submission) {
                    setSelectedSubmission(submission);
                    loadErrors(submission.id);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a submission...</option>
                {submissions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.file_name} - {new Date(sub.reporting_period).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedSubmission ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Select a submission to view validation errors</p>
            </div>
          ) : (
            <>
              <h4 className="text-base font-medium text-slate-900 mb-4">
                {selectedSubmission.file_name}
              </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Total Rows</p>
              <p className="text-2xl font-bold text-slate-900">{selectedSubmission.total_rows}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Valid Rows</p>
              <p className="text-2xl font-bold text-green-600">{selectedSubmission.valid_rows}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Error Rows</p>
              <p className="text-2xl font-bold text-red-600">{selectedSubmission.error_rows}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Error Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {((selectedSubmission.error_rows / selectedSubmission.total_rows) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          </>
          )}
        </div>

        {selectedSubmission && errors.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-slate-200">
              {errors.map((error) => (
                <div key={error.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-start gap-4">
                    {error.severity === 'critical' ? (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-base font-semibold text-slate-900">{error.error_type.replace(/_/g, ' ')}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          error.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {error.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{error.error_message}</p>
                      {error.field_name && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Field:</span> {error.field_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedSubmission ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Errors Found</h3>
            <p className="text-sm text-slate-600">This submission passed all validation checks</p>
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading validation system...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Validation Execution Progress Modal */}
      {isExecutingValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Executing Validations</h3>
                <p className="text-sm text-slate-600 mt-1">{executionStep}</p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${executionStep.includes('[1/3]') ? 'bg-blue-600 animate-pulse' : executionStep.includes('[2/3]') || executionStep.includes('[3/3]') ? 'bg-green-600' : 'bg-slate-300'}`}></div>
                <span className={executionStep.includes('[1/3]') ? 'text-blue-600 font-medium' : executionStep.includes('[2/3]') || executionStep.includes('[3/3]') ? 'text-green-600' : 'text-slate-500'}>
                  FR2052a Data Validation
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${executionStep.includes('[2/3]') ? 'bg-blue-600 animate-pulse' : executionStep.includes('[3/3]') ? 'bg-green-600' : 'bg-slate-300'}`}></div>
                <span className={executionStep.includes('[2/3]') ? 'text-blue-600 font-medium' : executionStep.includes('[3/3]') ? 'text-green-600' : 'text-slate-500'}>
                  LCR Calculation Validation
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${executionStep.includes('[3/3]') ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className={executionStep.includes('[3/3]') ? 'text-blue-600 font-medium' : 'text-slate-500'}>
                  NSFR Calculation Validation
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">FR 2052a Validation System</h1>
        <p className="text-slate-600">Comprehensive data quality and compliance validation for regulatory reporting</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'rules', label: 'Validation Rules', icon: Database },
            { key: 'submissions', label: 'Submissions', icon: FileText },
            { key: 'errors', label: 'Error Details', icon: AlertTriangle },
            { key: 'executions', label: 'Rule Executions', icon: CheckCircle },
            { key: 'lcr', label: 'LCR Validation', icon: Calculator },
            { key: 'nsfr', label: 'NSFR Validation', icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'rules' && renderRules()}
      {activeTab === 'submissions' && renderSubmissions()}
      {activeTab === 'errors' && renderErrors()}
      {activeTab === 'lcr' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">LCR Calculation Validation</h3>
                {selectedSubmission && (
                  <p className="text-sm text-slate-600 mt-1">
                    Submission: {selectedSubmission.file_name} • Period: {new Date(selectedSubmission.reporting_period).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Submission</label>
                  <select
                    value={selectedSubmission?.id || ''}
                    onChange={(e) => {
                      const submission = submissions.find(s => s.id === e.target.value);
                      if (submission) setSelectedSubmission(submission);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a submission...</option>
                    {submissions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.file_name} - {new Date(sub.reporting_period).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-5"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
          {selectedSubmission ? (
            <EnhancedLCRValidationScreen submissionId={selectedSubmission.id} />
          ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calculator className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Submission Selected</h3>
            <p className="text-sm text-slate-600 mb-4">
              Use the dropdown above to select a submission to view LCR calculation validation details.
            </p>
          </div>
          )}
        </div>
      )}
      {activeTab === 'nsfr' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">NSFR Calculation Validation</h3>
                {selectedSubmission && (
                  <p className="text-sm text-slate-600 mt-1">
                    Submission: {selectedSubmission.file_name} • Period: {new Date(selectedSubmission.reporting_period).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Submission</label>
                  <select
                    value={selectedSubmission?.id || ''}
                    onChange={(e) => {
                      const submission = submissions.find(s => s.id === e.target.value);
                      if (submission) setSelectedSubmission(submission);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a submission...</option>
                    {submissions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.file_name} - {new Date(sub.reporting_period).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-5"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
          {selectedSubmission ? (
            <NSFRValidationScreen submissionId={selectedSubmission.id} />
          ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Submission Selected</h3>
            <p className="text-sm text-slate-600 mb-4">
              Use the dropdown above to select a submission to view NSFR calculation validation details.
            </p>
          </div>
          )}
        </div>
      )}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Rule Executions</h3>
                {selectedSubmission && (
                  <p className="text-sm text-slate-600 mt-1">
                    Submission: {selectedSubmission.file_name} • Period: {new Date(selectedSubmission.reporting_period).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Submission</label>
                  <select
                    value={selectedSubmission?.id || ''}
                    onChange={(e) => {
                      const submission = submissions.find(s => s.id === e.target.value);
                      if (submission) setSelectedSubmission(submission);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a submission...</option>
                    {submissions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.file_name} - {new Date(sub.reporting_period).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-5"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
          {selectedSubmission ? (
            <ValidationRuleExecutions submissionId={selectedSubmission.id} />
          ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Submission Selected</h3>
            <p className="text-sm text-slate-600 mb-4">
              Use the dropdown above to select a submission to view rule execution details.
            </p>
            <p className="text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <strong>Rule Executions</strong> show which validation rules were applied to each submission,
              how many rows were checked, passed, and failed for each rule, and the execution time.
            </p>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
