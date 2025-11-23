import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Info, FileText, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NSFRValidation {
  id: string;
  submission_id: string;
  report_date: string;
  total_asf_calculated: number;
  total_rsf_calculated: number;
  nsfr_ratio_calculated: number;
  overall_validation_status: string;
}

interface ASFComponent {
  id: string;
  asf_category: string;
  product_type: string;
  total_amount: number;
  asf_factor: number;
  calculated_asf: number;
  rule_code: string | null;
}

interface RSFComponent {
  id: string;
  rsf_category: string;
  product_type: string;
  asset_class: string | null;
  total_amount: number;
  rsf_factor: number;
  calculated_rsf: number;
  rule_code: string | null;
}

interface CalculationRule {
  id: string;
  rule_code: string;
  rule_name: string;
  rule_category: string;
  fr2052a_appendix_reference: string;
  calculation_formula: string;
  factor_applied: number | null;
  rule_description: string;
  regulatory_citation: string | null;
  examples: string | null;
}

export function EnhancedNSFRValidationScreen() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [validation, setValidation] = useState<NSFRValidation | null>(null);
  const [asfComponents, setAsfComponents] = useState<ASFComponent[]>([]);
  const [rsfComponents, setRsfComponents] = useState<RSFComponent[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['asf', 'rsf']));
  const [loading, setLoading] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CalculationRule | null>(null);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [recordsData, setRecordsData] = useState<any[]>([]);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (selectedSubmissionId) {
      loadValidation();
    }
  }, [selectedSubmissionId]);

  const loadSubmissions = async () => {
    const { data } = await supabase
      .from('fr2052a_submissions')
      .select('id, reporting_period, legal_entity_id, submission_status')
      .order('reporting_period', { ascending: false })
      .limit(20);

    if (data) {
      setSubmissions(data);
      if (data.length > 0) {
        setSelectedSubmissionId(data[0].id);
      }
    }
  };

  const loadValidation = async () => {
    setLoading(true);

    const { data: validationData } = await supabase
      .from('nsfr_calculation_validations')
      .select('*')
      .eq('submission_id', selectedSubmissionId)
      .order('validation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (validationData) {
      setValidation(validationData);

      const { data: asfData } = await supabase
        .from('nsfr_asf_components')
        .select('*')
        .eq('nsfr_validation_id', validationData.id)
        .order('asf_category', { ascending: true });

      const { data: rsfData } = await supabase
        .from('nsfr_rsf_components')
        .select('*')
        .eq('nsfr_validation_id', validationData.id)
        .order('rsf_category', { ascending: true});

      setAsfComponents(asfData || []);
      setRsfComponents(rsfData || []);
    } else {
      setValidation(null);
      setAsfComponents([]);
      setRsfComponents([]);
    }

    setLoading(false);
  };

  const showRuleDetails = async (ruleCode: string) => {
    if (!ruleCode) {
      console.error('No rule code provided');
      return;
    }

    console.log('Fetching rule details for:', ruleCode);
    const { data, error } = await supabase
      .from('lcr_calculation_rules')
      .select('*')
      .eq('rule_code', ruleCode)
      .maybeSingle();

    if (error) {
      console.error('Error fetching rule:', error);
      return;
    }

    if (data) {
      console.log('Rule data loaded:', data);
      setSelectedRule(data);
      setShowRuleModal(true);
    } else {
      console.warn('No rule found for code:', ruleCode);
    }
  };

  const showSourceRecords = async (componentId: string, componentType: 'asf' | 'rsf') => {
    // Placeholder - would query fr2052a_data_rows based on component metadata
    console.log('Show source records for:', componentType, componentId);
    setRecordsData([]);
    setShowRecordsModal(true);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">NSFR Validation</h1>
        <p className="text-slate-600 mt-1">Net Stable Funding Ratio calculation validation and component drill-down</p>
      </div>

      {/* Submission Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Submission</label>
        <select
          value={selectedSubmissionId}
          onChange={(e) => setSelectedSubmissionId(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a submission --</option>
          {submissions.map((sub) => (
            <option key={sub.id} value={sub.id}>
              FR2052a_{sub.reporting_period} ({sub.submission_status})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading NSFR validation data...</p>
        </div>
      )}

      {!loading && validation && (
        <>
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-100 text-sm">Total ASF</p>
                <p className="text-2xl font-bold">{formatCurrency(validation.total_asf_calculated)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Total RSF</p>
                <p className="text-2xl font-bold">{formatCurrency(validation.total_rsf_calculated)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">NSFR Ratio</p>
                <p className="text-2xl font-bold">{formatPercent(validation.nsfr_ratio_calculated)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Regulatory Minimum</p>
                <p className="text-2xl font-bold">100.00%</p>
                <p className="text-xs mt-1">{validation.nsfr_ratio_calculated >= 1.0 ? '✓ Compliant' : '✗ Non-Compliant'}</p>
              </div>
            </div>
          </div>

          {/* ASF Components */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('asf')}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Available Stable Funding (ASF)</h2>
                  <p className="text-sm text-slate-600">Sources of stable funding</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-slate-900">{formatCurrency(validation.total_asf_calculated)}</span>
                {expandedSections.has('asf') ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {expandedSections.has('asf') && asfComponents.length > 0 && (
              <div className="p-6 space-y-4">
                {asfComponents.map((component) => (
                  <div key={component.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{component.asf_category}</h3>
                        <p className="text-sm text-slate-600">{component.product_type}</p>
                      </div>
                      <div className="flex gap-2">
                        {component.rule_code && (
                          <button
                            onClick={() => showRuleDetails(component.rule_code || '')}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Info className="h-3 w-3" />
                            View Rule
                          </button>
                        )}
                        <button
                          onClick={() => showSourceRecords(component.id, 'asf')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View Records
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-600">Total Amount</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(component.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">ASF Factor</p>
                        <p className="font-semibold text-slate-900">{formatPercent(component.asf_factor)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Calculated ASF</p>
                        <p className="font-semibold text-green-700">{formatCurrency(component.calculated_asf)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Rule Code</p>
                        <p className="text-xs font-mono text-slate-700">{component.rule_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expandedSections.has('asf') && asfComponents.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>No ASF components found for this validation</p>
              </div>
            )}
          </div>

          {/* RSF Components */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('rsf')}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Required Stable Funding (RSF)</h2>
                  <p className="text-sm text-slate-600">Assets requiring stable funding</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-slate-900">{formatCurrency(validation.total_rsf_calculated)}</span>
                {expandedSections.has('rsf') ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {expandedSections.has('rsf') && rsfComponents.length > 0 && (
              <div className="p-6 space-y-4">
                {rsfComponents.map((component) => (
                  <div key={component.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{component.rsf_category}</h3>
                        <p className="text-sm text-slate-600">{component.product_type}</p>
                        {component.asset_class && <p className="text-xs text-slate-500">{component.asset_class}</p>}
                      </div>
                      <div className="flex gap-2">
                        {component.rule_code && (
                          <button
                            onClick={() => showRuleDetails(component.rule_code || '')}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Info className="h-3 w-3" />
                            View Rule
                          </button>
                        )}
                        <button
                          onClick={() => showSourceRecords(component.id, 'rsf')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View Records
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-600">Total Amount</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(component.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">RSF Factor</p>
                        <p className="font-semibold text-slate-900">{formatPercent(component.rsf_factor)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Calculated RSF</p>
                        <p className="font-semibold text-orange-700">{formatCurrency(component.calculated_rsf)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Rule Code</p>
                        <p className="text-xs font-mono text-slate-700">{component.rule_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expandedSections.has('rsf') && rsfComponents.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>No RSF components found for this validation</p>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !validation && selectedSubmissionId && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-lg">
          <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No NSFR Validation Found</h3>
          <p className="text-slate-600">This submission has not been validated yet</p>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold">{selectedRule.rule_name}</h3>
              </div>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-white hover:text-blue-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Rule Code</p>
                <p className="text-slate-900 font-mono text-sm bg-slate-100 px-2 py-1 rounded">{selectedRule.rule_code}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">FR2052a Reference</p>
                <p className="text-slate-900">{selectedRule.fr2052a_appendix_reference}</p>
              </div>
              {selectedRule.regulatory_citation && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Regulatory Citation</p>
                  <p className="text-slate-900">{selectedRule.regulatory_citation}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Description</p>
                <p className="text-slate-900">{selectedRule.rule_description}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Calculation Formula</p>
                <p className="text-slate-900 font-mono text-sm bg-slate-100 px-3 py-2 rounded">{selectedRule.calculation_formula}</p>
              </div>
              {selectedRule.factor_applied !== null && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Factor Applied</p>
                  <p className="text-slate-900 text-lg font-bold">{formatPercent(selectedRule.factor_applied)}</p>
                </div>
              )}
              {selectedRule.examples && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Examples</p>
                  <p className="text-slate-900 text-sm">{selectedRule.examples}</p>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Modal (Placeholder) */}
      {showRecordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold">Source Records</h3>
              <button
                onClick={() => setShowRecordsModal(false)}
                className="text-white hover:text-blue-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600">Source records functionality to be implemented</p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowRecordsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
