import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign, Percent, Info, ChevronDown, ChevronRight, FileText, Database, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SourceRecordsModal } from '../shared/SourceRecordsModal';

interface LCRValidation {
  id: string;
  submission_id: string;
  report_date: string;
  validation_timestamp: string;

  level1_assets_calculated: number;
  level2a_assets_calculated: number;
  level2b_assets_calculated: number;
  total_hqla_calculated: number;

  level2a_cap_applied: boolean;
  level2a_cap_amount: number;
  level2b_cap_applied: boolean;
  level2b_cap_amount: number;

  retail_outflows_calculated: number;
  wholesale_outflows_calculated: number;
  secured_funding_outflows_calculated: number;
  derivatives_outflows_calculated: number;
  other_outflows_calculated: number;
  total_outflows_calculated: number;

  total_inflows_calculated: number;
  capped_inflows_calculated: number;
  inflow_cap_applied: boolean;

  net_cash_outflows_calculated: number;
  lcr_ratio_calculated: number;

  level1_validation_status: string;
  level2a_validation_status: string;
  level2b_validation_status: string;
  hqla_validation_status: string;
  outflows_validation_status: string;
  inflows_validation_status: string;
  lcr_validation_status: string;
  overall_validation_status: string;
}

interface HQLAComponent {
  id: string;
  hqla_level: number;
  hqla_category: string;
  product_category: string;
  total_amount: number;
  haircut_rate: number;
  amount_after_haircut: number;
  liquidity_value_factor: number;
  liquidity_value: number;
  cap_applied: boolean;
  cap_amount: number | null;
  record_count: number;
  calculation_notes: string | null;
  fr2052a_line_references: string[];
}

interface OutflowComponent {
  id: string;
  outflow_category: string;
  product_type: string;
  counterparty_type: string | null;
  total_amount: number;
  runoff_rate: number;
  calculated_outflow: number;
  record_count: number;
  calculation_methodology: string | null;
  regulatory_reference: string | null;
  fr2052a_line_references: string[];
}

interface InflowComponent {
  id: string;
  inflow_category: string;
  product_type: string;
  counterparty_type: string | null;
  total_amount: number;
  inflow_rate: number;
  calculated_inflow: number;
  record_count: number;
  calculation_methodology: string | null;
  regulatory_reference: string | null;
  fr2052a_line_references: string[];
}

interface CalculationRule {
  id: string;
  rule_code: string;
  rule_category: string;
  rule_name: string;
  fr2052a_appendix_reference: string;
  calculation_formula: string;
  factor_applied: number | null;
  rule_description: string;
  regulatory_citation: string | null;
  examples: string | null;
}

interface EnhancedLCRValidationScreenProps {
  submissionId: string;
}

export function EnhancedLCRValidationScreen({ submissionId }: EnhancedLCRValidationScreenProps) {
  const [validation, setValidation] = useState<LCRValidation | null>(null);
  const [hqlaComponents, setHqlaComponents] = useState<HQLAComponent[]>([]);
  const [outflowComponents, setOutflowComponents] = useState<OutflowComponent[]>([]);
  const [inflowComponents, setInflowComponents] = useState<InflowComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hqla', 'outflows', 'inflows']));
  const [selectedRule, setSelectedRule] = useState<CalculationRule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceModalData, setSourceModalData] = useState<{
    componentType: 'hqla' | 'outflow' | 'inflow';
    componentName: string;
    productIds: string[];
    totalAmount: number;
    calculatedAmount: number;
    factor: number;
    ruleCode: string | null;
  } | null>(null);

  useEffect(() => {
    loadValidationData();
  }, [submissionId]);

  const loadValidationData = async () => {
    setLoading(true);
    setValidation(null);
    setHqlaComponents([]);
    setOutflowComponents([]);
    setInflowComponents([]);

    // Load validation summary
    const { data: validationData } = await supabase
      .from('lcr_calculation_validations')
      .select('*')
      .eq('submission_id', submissionId)
      .order('validation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (validationData) {
      setValidation(validationData);

      // Load detailed components
      const { data: hqla } = await supabase
        .from('lcr_hqla_components')
        .select('*')
        .eq('lcr_validation_id', validationData.id)
        .order('hqla_level', { ascending: true });

      const { data: outflows } = await supabase
        .from('lcr_outflow_components')
        .select('*')
        .eq('lcr_validation_id', validationData.id)
        .order('outflow_category', { ascending: true });

      const { data: inflows } = await supabase
        .from('lcr_inflow_components')
        .select('*')
        .eq('lcr_validation_id', validationData.id)
        .order('inflow_category', { ascending: true });

      if (hqla) setHqlaComponents(hqla);
      if (outflows) setOutflowComponents(outflows);
      if (inflows) setInflowComponents(inflows);
    }

    setLoading(false);
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

  const showRuleDetails = async (ruleCode: string) => {
    const { data } = await supabase
      .from('lcr_calculation_rules')
      .select('*')
      .eq('rule_code', ruleCode)
      .maybeSingle();

    if (data) {
      setSelectedRule(data);
      setShowRuleModal(true);
    }
  };

  const showSourceRecords = (
    componentType: 'hqla' | 'outflow' | 'inflow',
    componentName: string,
    productIds: string[],
    totalAmount: number,
    calculatedAmount: number,
    factor: number,
    ruleCode: string | null
  ) => {
    setSourceModalData({
      componentType,
      componentName,
      productIds,
      totalAmount,
      calculatedAmount,
      factor,
      ruleCode
    });
    setShowSourceModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number, decimals = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'passed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'failed') return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'passed') return 'text-green-600';
    if (status === 'failed') return 'text-red-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading LCR validation details...</div>;
  }

  if (!validation) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">LCR Validation Not Yet Performed</h3>
        <p className="text-sm text-slate-600 mb-4">
          LCR calculation validation has not been executed for this submission.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <p className="text-sm font-medium text-blue-900 mb-2">To execute LCR validation:</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to the <span className="font-semibold">Submissions</span> tab</li>
            <li>Find this submission in the table</li>
            <li>Click the <span className="font-semibold">Execute Validations</span> button</li>
            <li>Wait for validation to complete</li>
            <li>Return here to view detailed LCR calculation breakdown</li>
          </ol>
        </div>
      </div>
    );
  }

  // Calculate component totals for verification
  const hqlaLevel1Total = hqlaComponents.filter(c => c.hqla_level === 1).reduce((sum, c) => sum + c.liquidity_value, 0);
  const hqlaLevel2aTotal = hqlaComponents.filter(c => c.hqla_level === 2).reduce((sum, c) => sum + c.liquidity_value, 0);
  const hqlaLevel2bTotal = hqlaComponents.filter(c => c.hqla_level === 3).reduce((sum, c) => sum + c.liquidity_value, 0);

  const outflowsByCategory = {
    retail: outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Retail').reduce((sum, c) => sum + c.calculated_outflow, 0),
    wholesale: outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Wholesale').reduce((sum, c) => sum + c.calculated_outflow, 0),
    secured: outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Secured').reduce((sum, c) => sum + c.calculated_outflow, 0),
    derivatives: outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Derivatives').reduce((sum, c) => sum + c.calculated_outflow, 0),
    contingent: outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Contingent').reduce((sum, c) => sum + c.calculated_outflow, 0),
  };

  const totalOutflowsFromComponents = Object.values(outflowsByCategory).reduce((sum, val) => sum + val, 0);
  const totalInflowsFromComponents = inflowComponents.reduce((sum, c) => sum + c.calculated_inflow, 0);

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">LCR Calculation Validation</h2>
          <div className="flex items-center gap-2">
            {getStatusIcon(validation.overall_validation_status)}
            <span className={`text-lg font-semibold ${getStatusColor(validation.overall_validation_status)}`}>
              {validation.overall_validation_status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Report Date</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Date(validation.report_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">LCR Ratio</p>
            <p className={`text-lg font-semibold ${getStatusColor(validation.lcr_validation_status)}`}>
              {formatPercent(validation.lcr_ratio_calculated)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Compliance Status</p>
            <p className={`text-lg font-semibold ${validation.lcr_ratio_calculated >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
              {validation.lcr_ratio_calculated >= 1.0 ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </p>
          </div>
        </div>
      </div>

      {/* HQLA Components - Enhanced with Total Amounts and Liquidity Values */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div
          className="bg-blue-50 px-6 py-4 border-b border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => toggleSection('hqla')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              High-Quality Liquid Assets (HQLA)
              {expandedSections.has('hqla') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(validation.total_hqla_calculated)}</div>
          </div>
        </div>

        {expandedSections.has('hqla') && (
          <div className="p-6 space-y-4">
            {/* Level 1 Assets */}
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 text-lg">Level 1 Assets</h4>
                {getStatusIcon(validation.level1_validation_status)}
              </div>

              {hqlaComponents.filter(c => c.hqla_level === 1).length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-900 font-medium mb-1">No component data available</p>
                  <p className="text-xs text-amber-800">
                    Component breakdown data needs to be generated. Go to <strong>Data Setup</strong> and click <strong>"Generate Sample Data"</strong> to populate detailed component breakdowns.
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    Summary total shown below was calculated with old method.
                  </p>
                </div>
              ) : (
                hqlaComponents.filter(c => c.hqla_level === 1).map((component) => (
                  <div key={component.id} className="bg-white rounded border border-green-200 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{component.hqla_category}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showSourceRecords(
                            'hqla',
                            component.hqla_category,
                            component.fr2052a_line_references || [],
                            component.total_amount,
                            component.liquidity_value,
                            component.liquidity_value_factor,
                            'HQLA_L1_' + component.product_category.toUpperCase()
                          )}
                          className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                          title="View source FR2052a records"
                        >
                          <List className="h-3 w-3" />
                          View Records
                        </button>
                        <button
                          onClick={() => showRuleDetails('HQLA_L1_' + component.product_category.toUpperCase())}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Info className="h-3 w-3" />
                          View Rule
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-600">Total Amount</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(component.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Haircut Rate</p>
                        <p className="font-semibold text-slate-900">{formatPercent(component.haircut_rate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Liquidity Value Factor</p>
                        <p className="font-semibold text-green-700">{formatPercent(component.liquidity_value_factor)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Liquidity Value</p>
                        <p className="font-bold text-green-600">{formatCurrency(component.liquidity_value)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {component.record_count} FR2052a records • {component.calculation_notes || 'No haircut, 100% liquidity value'}
                    </p>
                  </div>
                ))
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-green-300 mt-3">
                <span className="font-bold text-slate-900">Level 1 Total Liquidity Value</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(validation.level1_assets_calculated)}</span>
              </div>
            </div>

            {/* Level 2A Assets */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 text-lg">Level 2A Assets</h4>
                {getStatusIcon(validation.level2a_validation_status)}
              </div>

              {hqlaComponents.filter(c => c.hqla_level === 2).length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-900 font-medium mb-1">No component data available</p>
                  <p className="text-xs text-amber-800">
                    Component breakdown data needs to be generated. Go to <strong>Data Setup</strong> and click <strong>"Generate Sample Data"</strong>.
                  </p>
                </div>
              ) : (
                hqlaComponents.filter(c => c.hqla_level === 2).map((component) => (
                  <div key={component.id} className="bg-white rounded border border-blue-200 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{component.hqla_category}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showSourceRecords(
                            'hqla',
                            component.hqla_category,
                            component.fr2052a_line_references || [],
                            component.total_amount,
                            component.liquidity_value,
                            component.liquidity_value_factor,
                            'HQLA_L2A_GSE'
                          )}
                          className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                          title="View source FR2052a records"
                        >
                          <List className="h-3 w-3" />
                          View Records
                        </button>
                        <button
                          onClick={() => showRuleDetails('HQLA_L2A_GSE')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Info className="h-3 w-3" />
                          View Rule
                        </button>
                      </div>
                    </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-600">Total Amount</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(component.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Haircut Rate</p>
                      <p className="font-semibold text-slate-900">{formatPercent(component.haircut_rate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Liquidity Value Factor</p>
                      <p className="font-semibold text-blue-700">{formatPercent(component.liquidity_value_factor)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Liquidity Value</p>
                      <p className="font-bold text-blue-600">{formatCurrency(component.liquidity_value)}</p>
                    </div>
                  </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {component.record_count} FR2052a records • {component.calculation_notes || '15% haircut applied, 85% liquidity value'}
                    </p>
                  </div>
                ))
              )}

              {validation.level2a_cap_applied && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-2">
                  <p className="text-sm font-medium text-yellow-900">
                    Level 2A Cap Applied: Limited to 66.67% of Level 1 assets = {formatCurrency(validation.level2a_cap_amount)}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300 mt-3">
                <span className="font-bold text-slate-900">Level 2A Total Liquidity Value</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(validation.level2a_assets_calculated)}</span>
              </div>
            </div>

            {/* Level 2B Assets */}
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 text-lg">Level 2B Assets</h4>
                {getStatusIcon(validation.level2b_validation_status)}
              </div>

              {hqlaComponents.filter(c => c.hqla_level === 3).length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-900 font-medium mb-1">No component data available</p>
                  <p className="text-xs text-amber-800">
                    Component breakdown data needs to be generated. Go to <strong>Data Setup</strong> and click <strong>"Generate Sample Data"</strong>.
                  </p>
                </div>
              ) : (
                hqlaComponents.filter(c => c.hqla_level === 3).map((component) => (
                  <div key={component.id} className="bg-white rounded border border-purple-200 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{component.hqla_category}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showSourceRecords(
                            'hqla',
                            component.hqla_category,
                            component.fr2052a_line_references || [],
                            component.total_amount,
                            component.liquidity_value,
                            component.liquidity_value_factor,
                            'HQLA_L2B_CORPORATE'
                          )}
                          className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                          title="View source FR2052a records"
                        >
                          <List className="h-3 w-3" />
                          View Records
                        </button>
                        <button
                          onClick={() => showRuleDetails('HQLA_L2B_CORPORATE')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Info className="h-3 w-3" />
                          View Rule
                        </button>
                      </div>
                    </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-600">Total Amount</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(component.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Haircut Rate</p>
                      <p className="font-semibold text-slate-900">{formatPercent(component.haircut_rate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Liquidity Value Factor</p>
                      <p className="font-semibold text-purple-700">{formatPercent(component.liquidity_value_factor)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Liquidity Value</p>
                      <p className="font-bold text-purple-600">{formatCurrency(component.liquidity_value)}</p>
                    </div>
                  </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {component.record_count} FR2052a records • {component.calculation_notes || '50% haircut applied, 50% liquidity value'}
                    </p>
                  </div>
                ))
              )}

              {validation.level2b_cap_applied && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-2">
                  <p className="text-sm font-medium text-yellow-900">
                    Level 2B Cap Applied: Limited to 17.65% of Level 1 assets = {formatCurrency(validation.level2b_cap_amount)}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-purple-300 mt-3">
                <span className="font-bold text-slate-900">Level 2B Total Liquidity Value</span>
                <span className="text-xl font-bold text-purple-600">{formatCurrency(validation.level2b_assets_calculated)}</span>
              </div>
            </div>

            {/* Total HQLA Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Total High-Quality Liquid Assets</p>
                  <p className="text-4xl font-bold">{formatCurrency(validation.total_hqla_calculated)}</p>
                  <p className="text-xs text-blue-100 mt-2">
                    Level 1: {formatCurrency(validation.level1_assets_calculated)} +
                    Level 2A: {formatCurrency(validation.level2a_assets_calculated)} +
                    Level 2B: {formatCurrency(validation.level2b_assets_calculated)}
                  </p>
                </div>
                {getStatusIcon(validation.hqla_validation_status)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cash Outflows - Enhanced with Detailed Breakdown */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div
          className="bg-red-50 px-6 py-4 border-b border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => toggleSection('outflows')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              Cash Outflows (30-Day Period)
              {expandedSections.has('outflows') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(validation.total_outflows_calculated)}</div>
          </div>
        </div>

        {expandedSections.has('outflows') && (
          <div className="p-6 space-y-4">
            {/* Retail Deposit Outflows */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                <span>Retail Deposit Outflows</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(outflowsByCategory.retail)}</span>
              </h4>
              {outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Retail').map((component) => (
                <div key={component.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{component.product_type}</p>
                    <p className="text-xs text-slate-600">
                      {formatCurrency(component.total_amount)} × {formatPercent(component.runoff_rate)} runoff rate • {component.record_count} records
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(component.calculated_outflow)}</p>
                    <button
                      onClick={() => component.regulatory_reference && showRuleDetails(component.regulatory_reference)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Rule
                    </button>
                  </div>
                </div>
              ))}
              {outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Retail').length === 0 && (
                <p className="text-sm text-slate-500 italic">No retail deposit outflows</p>
              )}
            </div>

            {/* Wholesale Funding Outflows */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                <span>Wholesale Funding Outflows</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(outflowsByCategory.wholesale)}</span>
              </h4>
              {outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Wholesale').map((component) => (
                <div key={component.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{component.product_type}</p>
                    <p className="text-xs text-slate-600">
                      {formatCurrency(component.total_amount)} × {formatPercent(component.runoff_rate)} runoff rate • {component.record_count} records
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(component.calculated_outflow)}</p>
                    <button
                      onClick={() => component.regulatory_reference && showRuleDetails(component.regulatory_reference)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Rule
                    </button>
                  </div>
                </div>
              ))}
              {outflowComponents.filter(c => c.outflow_category === 'Cash_Outflows_Wholesale').length === 0 && (
                <p className="text-sm text-slate-500 italic">No wholesale funding outflows</p>
              )}
            </div>

            {/* Other Outflow Categories */}
            {['Cash_Outflows_Secured', 'Cash_Outflows_Derivatives', 'Cash_Outflows_Contingent'].map((category) => {
              const categoryComponents = outflowComponents.filter(c => c.outflow_category === category);
              const categoryTotal = categoryComponents.reduce((sum, c) => sum + c.calculated_outflow, 0);
              const categoryName = category.replace('Cash_Outflows_', '').replace('_', ' ');

              return categoryComponents.length > 0 && (
                <div key={category} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                    <span>{categoryName} Outflows</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(categoryTotal)}</span>
                  </h4>
                  {categoryComponents.map((component) => (
                    <div key={component.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{component.product_type}</p>
                        <p className="text-xs text-slate-600">
                          {component.runoff_rate > 0
                            ? `${formatCurrency(component.total_amount)} × ${formatPercent(component.runoff_rate)}`
                            : formatCurrency(component.total_amount)
                          } • {component.record_count} records
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">{formatCurrency(component.calculated_outflow)}</p>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Total Outflows */}
            <div className="bg-red-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-100">Total Cash Outflows</p>
                  <p className="text-3xl font-bold">{formatCurrency(validation.total_outflows_calculated)}</p>
                  {outflowComponents.length > 0 && totalOutflowsFromComponents !== validation.total_outflows_calculated && (
                    <p className="text-xs text-red-200 mt-1">
                      Component sum: {formatCurrency(totalOutflowsFromComponents)}
                      {Math.abs(totalOutflowsFromComponents - validation.total_outflows_calculated) > 100 && (
                        <span className="ml-1">(Variance detected)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cash Inflows - Enhanced with Product Breakdown */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div
          className="bg-green-50 px-6 py-4 border-b border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => toggleSection('inflows')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Cash Inflows (30-Day Period)
              {expandedSections.has('inflows') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(validation.capped_inflows_calculated)}</div>
          </div>
        </div>

        {expandedSections.has('inflows') && (
          <div className="p-6 space-y-4">
            {/* Inflow Categories */}
            {['Maturing_Loans', 'Maturing_Securities', 'Reverse_Repos', 'Other_Contractual_Inflows'].map((category) => {
              const categoryComponents = inflowComponents.filter(c =>
                c.inflow_category.includes(category.replace('_', ' ')) || c.inflow_category === category
              );
              const categoryTotal = categoryComponents.reduce((sum, c) => sum + c.calculated_inflow, 0);
              const categoryName = category.replace(/_/g, ' ');

              return categoryComponents.length > 0 && (
                <div key={category} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                    <span>{categoryName}</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(categoryTotal)}</span>
                  </h4>
                  {categoryComponents.map((component) => (
                    <div key={component.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{component.product_type}</p>
                        <p className="text-xs text-slate-600">
                          {formatCurrency(component.total_amount)} × {formatPercent(component.inflow_rate)} inflow rate • {component.record_count} records
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(component.calculated_inflow)}</p>
                        <button
                          onClick={() => component.regulatory_reference && showRuleDetails(component.regulatory_reference)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Rule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {inflowComponents.length === 0 && (
              <p className="text-sm text-slate-500 italic text-center py-4">No cash inflow details available</p>
            )}

            {/* Inflow Cap Notice */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">Inflow Cap Applied</p>
                  <p className="text-sm text-yellow-800 mb-2">
                    Per FR2052a Appendix VI, total inflows are capped at 75% of total outflows
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-yellow-700">Total Inflows (Uncapped)</p>
                      <p className="font-semibold text-yellow-900">{formatCurrency(validation.total_inflows_calculated)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-yellow-700">Maximum Allowed (75% of Outflows)</p>
                      <p className="font-semibold text-yellow-900">{formatCurrency(validation.total_outflows_calculated * 0.75)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-yellow-700">Capped Inflows (Used in LCR)</p>
                      <p className="font-bold text-yellow-900">{formatCurrency(validation.capped_inflows_calculated)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Inflows */}
            <div className="bg-green-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Capped Cash Inflows (Used in LCR)</p>
                  <p className="text-3xl font-bold">{formatCurrency(validation.capped_inflows_calculated)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final LCR Calculation */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Percent className="h-5 w-5 text-slate-600" />
            Final LCR Calculation
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-700">Net Cash Outflows</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(validation.net_cash_outflows_calculated)}</span>
            </div>
            <p className="text-xs text-slate-500">
              Formula: MAX(Total Outflows - Capped Inflows, 25% of Total Outflows)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              MAX({formatCurrency(validation.total_outflows_calculated)} - {formatCurrency(validation.capped_inflows_calculated)}, {formatCurrency(validation.total_outflows_calculated * 0.25)})
              = {formatCurrency(validation.net_cash_outflows_calculated)}
            </p>
          </div>

          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-slate-300 mb-2">Liquidity Coverage Ratio</p>
              <p className="text-5xl font-bold mb-3">{formatPercent(validation.lcr_ratio_calculated)}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {validation.lcr_ratio_calculated >= 1.0 ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-green-400 font-semibold text-lg">COMPLIANT</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-400" />
                    <span className="text-red-400 font-semibold text-lg">NON-COMPLIANT</span>
                  </>
                )}
              </div>
              <div className="bg-slate-700 bg-opacity-50 rounded p-3">
                <p className="text-xs text-slate-300 mb-1">Calculation</p>
                <p className="text-sm text-white font-mono">
                  LCR = Total HQLA ÷ Net Cash Outflows
                </p>
                <p className="text-sm text-white font-mono mt-1">
                  LCR = {formatCurrency(validation.total_hqla_calculated)} ÷ {formatCurrency(validation.net_cash_outflows_calculated)}
                </p>
                <p className="text-sm text-white font-mono mt-1">
                  LCR = {formatPercent(validation.lcr_ratio_calculated)}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Regulatory Minimum: 100% • Basel III / 12 CFR 249
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rule Details Modal */}
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
                className="text-white hover:text-blue-100"
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

      {/* Source Records Modal */}
      {sourceModalData && (
        <SourceRecordsModal
          isOpen={showSourceModal}
          onClose={() => setShowSourceModal(false)}
          componentType={sourceModalData.componentType}
          componentName={sourceModalData.componentName}
          submissionId={submissionId}
          productIds={sourceModalData.productIds}
          totalAmount={sourceModalData.totalAmount}
          calculatedAmount={sourceModalData.calculatedAmount}
          factor={sourceModalData.factor}
          ruleCode={sourceModalData.ruleCode}
        />
      )}
    </div>
  );
}
