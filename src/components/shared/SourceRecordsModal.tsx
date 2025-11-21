import { useState, useEffect } from 'react';
import { X, FileText, Database, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SourceRecord {
  id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  sub_product: string | null;
  maturity_bucket: string;
  counterparty_type: string;
  asset_class: string | null;
  outstanding_balance: number;
  projected_cash_inflow: number;
  projected_cash_outflow: number;
  is_hqla: boolean;
  hqla_level: number | null;
  haircut: number;
  runoff_rate: number | null;
  encumbered_amount: number;
  currency: string;
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

interface SourceRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: 'hqla' | 'outflow' | 'inflow';
  componentName: string;
  submissionId: string;
  productIds: string[];
  totalAmount: number;
  calculatedAmount: number;
  factor: number;
  ruleCode: string | null;
}

export function SourceRecordsModal({
  isOpen,
  onClose,
  componentType,
  componentName,
  submissionId,
  productIds,
  totalAmount,
  calculatedAmount,
  factor,
  ruleCode
}: SourceRecordsModalProps) {
  const [records, setRecords] = useState<SourceRecord[]>([]);
  const [rule, setRule] = useState<CalculationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'summary' | 'rule' | 'records'>('summary');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, productIds, ruleCode]);

  const loadData = async () => {
    setLoading(true);

    // Load source records
    if (productIds && productIds.length > 0) {
      const { data: recordsData } = await supabase
        .from('fr2052a_data_rows')
        .select('*')
        .eq('submission_id', submissionId)
        .in('product_id', productIds)
        .order('outstanding_balance', { ascending: false });

      if (recordsData) {
        setRecords(recordsData);
      }
    }

    // Load calculation rule
    if (ruleCode) {
      const { data: ruleData } = await supabase
        .from('lcr_calculation_rules')
        .select('*')
        .eq('rule_code', ruleCode)
        .maybeSingle();

      if (ruleData) {
        setRule(ruleData);
      }
    }

    setLoading(false);
  };

  const toggleRecord = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">{componentName}</h3>
              <p className="text-sm text-blue-100">
                {componentType === 'hqla' && 'HQLA Component Details'}
                {componentType === 'outflow' && 'Cash Outflow Component Details'}
                {componentType === 'inflow' && 'Cash Inflow Component Details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 p-1 rounded-full hover:bg-blue-800 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('rule')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Calculation Rule
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'records'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Source Records ({records.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading details...</p>
            </div>
          ) : (
            <>
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Calculation Summary</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
                        <p className="text-xs text-slate-500 mt-1">Sum of {records.length} FR2052a line items</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">
                          {componentType === 'hqla' && 'Liquidity Value'}
                          {componentType === 'outflow' && 'Calculated Outflow'}
                          {componentType === 'inflow' && 'Calculated Inflow'}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculatedAmount)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {componentType === 'hqla' && `After ${formatPercent(1 - factor)} haircut → ${formatPercent(factor)} liquidity value`}
                          {componentType === 'outflow' && `Applied ${formatPercent(factor)} runoff rate`}
                          {componentType === 'inflow' && `Applied ${formatPercent(factor)} inflow rate`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">Calculation:</span>
                        <span className="font-mono text-slate-900">
                          {formatCurrency(totalAmount)} × {formatPercent(factor)} = {formatCurrency(calculatedAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {rule && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-slate-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-2">{rule.rule_name}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600">Rule Code:</span>
                              <span className="ml-2 font-mono text-slate-900">{rule.rule_code}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">FR2052a Reference:</span>
                              <span className="ml-2 text-slate-900">{rule.fr2052a_appendix_reference}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <button
                              onClick={() => setActiveTab('rule')}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Full Rule Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-900">
                      <p className="font-medium mb-1">Source Record Traceability</p>
                      <p>
                        This component is calculated from {records.length} individual FR2052a line items.
                        Click the "Source Records" tab to view the complete list of underlying records with full details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rule Tab */}
              {activeTab === 'rule' && rule && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{rule.rule_name}</h4>
                    <p className="text-sm text-slate-600">{rule.rule_code}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-blue-900 mb-1">FR2052a Appendix Reference</p>
                        <p className="text-sm text-blue-800">{rule.fr2052a_appendix_reference}</p>
                      </div>
                      {rule.regulatory_citation && (
                        <div>
                          <p className="text-xs font-medium text-blue-900 mb-1">Regulatory Citation</p>
                          <p className="text-sm text-blue-800">{rule.regulatory_citation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
                    <p className="text-sm text-slate-900 leading-relaxed">{rule.rule_description}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Calculation Formula</p>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm">
                      {rule.calculation_formula}
                    </div>
                  </div>

                  {rule.factor_applied !== null && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900 mb-1">Factor Applied</p>
                      <p className="text-2xl font-bold text-green-700">{formatPercent(rule.factor_applied)}</p>
                    </div>
                  )}

                  {rule.examples && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Examples</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-900">{rule.examples}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rule' && !rule && (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No calculation rule available for this component</p>
                </div>
              )}

              {/* Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-3">
                  {records.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No source records found</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">Total Records:</span>
                          <span className="font-semibold text-slate-900">{records.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-slate-700">Sum of Outstanding Balances:</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(records.reduce((sum, r) => sum + (r.outstanding_balance || 0), 0))}
                          </span>
                        </div>
                      </div>

                      {records.map((record) => (
                        <div key={record.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div
                            className="bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleRecord(record.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {expandedRecords.has(record.id) ? (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{record.product_name}</p>
                                  <p className="text-xs text-slate-600 mt-0.5">
                                    {record.product_category} • {record.counterparty_type} • {record.maturity_bucket}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">{formatCurrency(record.outstanding_balance)}</p>
                                {record.is_hqla && record.hqla_level && (
                                  <p className="text-xs text-blue-600">HQLA Level {record.hqla_level}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {expandedRecords.has(record.id) && (
                            <div className="bg-slate-50 border-t border-slate-200 p-4">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Product ID</p>
                                  <p className="font-mono text-xs text-slate-900">{record.product_id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Currency</p>
                                  <p className="text-slate-900">{record.currency}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Asset Class</p>
                                  <p className="text-slate-900">{record.asset_class || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Outstanding Balance</p>
                                  <p className="font-semibold text-slate-900">{formatCurrency(record.outstanding_balance)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Projected Cash Inflow</p>
                                  <p className="font-semibold text-green-700">{formatCurrency(record.projected_cash_inflow)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Projected Cash Outflow</p>
                                  <p className="font-semibold text-red-700">{formatCurrency(record.projected_cash_outflow)}</p>
                                </div>
                                {record.haircut > 0 && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">Haircut Rate</p>
                                    <p className="text-slate-900">{formatPercent(record.haircut)}</p>
                                  </div>
                                )}
                                {record.runoff_rate && record.runoff_rate > 0 && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">Runoff Rate</p>
                                    <p className="text-slate-900">{formatPercent(record.runoff_rate)}</p>
                                  </div>
                                )}
                                {record.encumbered_amount > 0 && (
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">Encumbered Amount</p>
                                    <p className="text-slate-900">{formatCurrency(record.encumbered_amount)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
