import { useState, useEffect } from 'react';
import { FileUp, CheckCircle, XCircle, AlertTriangle, Database, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { seedAllFR2052aData } from '../utils/seedFR2052aData';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'submissions' | 'errors'>('overview');
  const [dataSeeded, setDataSeeded] = useState(false);

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

    if (rules) setValidationRules(rules);
    if (subs) {
      const formattedSubs = subs.map(s => ({
        id: s.id,
        file_name: `FR2052a_${s.reporting_period}`,
        upload_timestamp: s.created_at,
        reporting_entity: s.legal_entity_id,
        reporting_period: s.reporting_period,
        submission_status: s.submission_status,
        total_rows: 0,
        valid_rows: 0,
        error_rows: 0
      }));
      setSubmissions(formattedSubs);
    }

    setLoading(false);
  };

  const handleSeedData = async () => {
    setLoading(true);
    await seedAllFR2052aData();
    await loadData();
    setDataSeeded(true);
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Rows
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Errors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {submission.file_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {submission.reporting_entity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {new Date(submission.reporting_period).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    submission.submission_status === 'validated' ? 'bg-green-100 text-green-800' :
                    submission.submission_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.submission_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {submission.total_rows}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <span className={submission.error_rows > 0 ? 'text-red-600 font-semibold' : ''}>
                    {submission.error_rows}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      loadErrors(submission.id);
                      setActiveTab('errors');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderErrors = () => {
    if (!selectedSubmission) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Submission Selected</h3>
          <p className="text-sm text-slate-600">Select a submission to view validation errors</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Submission: {selectedSubmission.file_name}
          </h3>
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
        </div>

        {errors.length > 0 ? (
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
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Errors Found</h3>
            <p className="text-sm text-slate-600">This submission passed all validation checks</p>
          </div>
        )}
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
    </div>
  );
}
