import { useState, useEffect } from 'react';
import { X, FileText, Database, Download, Eye, EyeOff, Settings } from 'lucide-react';
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
  report_date: string;
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

interface SourceRecordsTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: 'hqla' | 'outflow' | 'inflow' | 'asf' | 'rsf';
  componentName: string;
  submissionId: string;
  reportDate: string;
  totalAmount: number;
  calculatedAmount: number;
  factor: number;
  ruleCode: string | null;
}

export function SourceRecordsTableModal({
  isOpen,
  onClose,
  componentType,
  componentName,
  submissionId,
  reportDate,
  totalAmount,
  calculatedAmount,
  factor,
  ruleCode
}: SourceRecordsTableModalProps) {
  const [records, setRecords] = useState<SourceRecord[]>([]);
  const [rule, setRule] = useState<CalculationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'rule' | 'records'>('summary');
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    product_id: true,
    product_name: true,
    product_category: true,
    sub_product: false,
    maturity_bucket: true,
    counterparty_type: true,
    asset_class: true,
    outstanding_balance: true,
    projected_cash_inflow: true,
    projected_cash_outflow: true,
    is_hqla: false,
    hqla_level: false,
    haircut: true,
    runoff_rate: true,
    encumbered_amount: false,
    currency: true,
    report_date: false
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, submissionId, reportDate]);

  const loadData = async () => {
    setLoading(true);

    // Load source records based on report date
    const { data: recordsData } = await supabase
      .from('fr2052a_data_rows')
      .select('*')
      .eq('report_date', reportDate)
      .is('user_id', null)
      .order('outstanding_balance', { ascending: false })
      .limit(1000);

    if (recordsData) {
      setRecords(recordsData);
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

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const exportToExcel = () => {
    const headers = Object.entries(visibleColumns)
      .filter(([_, visible]) => visible)
      .map(([key]) => key.replace(/_/g, ' ').toUpperCase());

    const rows = records.map(record => {
      const row: any = {};
      Object.entries(visibleColumns).forEach(([key, visible]) => {
        if (visible) {
          const value = record[key as keyof SourceRecord];
          if (typeof value === 'number') {
            row[key] = value;
          } else if (typeof value === 'boolean') {
            row[key] = value ? 'Yes' : 'No';
          } else {
            row[key] = value || '';
          }
        }
      });
      return row;
    });

    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const values = Object.values(row).map(val => {
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      });
      csvContent += values.join(',') + '\n';
    });

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${componentName.replace(/\s+/g, '_')}_source_records_${reportDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const columnLabels: Record<keyof typeof visibleColumns, string> = {
    product_id: 'Product ID',
    product_name: 'Product Name',
    product_category: 'Category',
    sub_product: 'Sub-Product',
    maturity_bucket: 'Maturity',
    counterparty_type: 'Counterparty',
    asset_class: 'Asset Class',
    outstanding_balance: 'Outstanding Balance',
    projected_cash_inflow: 'Cash Inflow',
    projected_cash_outflow: 'Cash Outflow',
    is_hqla: 'Is HQLA',
    hqla_level: 'HQLA Level',
    haircut: 'Haircut',
    runoff_rate: 'Runoff Rate',
    encumbered_amount: 'Encumbered',
    currency: 'Currency',
    report_date: 'Report Date'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">{componentName}</h3>
              <p className="text-sm text-blue-100">
                {componentType === 'hqla' && 'HQLA Component - FR2052a Source Data'}
                {componentType === 'outflow' && 'Cash Outflow Component - FR2052a Source Data'}
                {componentType === 'inflow' && 'Cash Inflow Component - FR2052a Source Data'}
                {componentType === 'asf' && 'ASF Component - FR2052a Source Data'}
                {componentType === 'rsf' && 'RSF Component - FR2052a Source Data'}
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
                          {(componentType === 'hqla' || componentType === 'asf') && 'Calculated Value'}
                          {componentType === 'outflow' && 'Calculated Outflow'}
                          {componentType === 'inflow' && 'Calculated Inflow'}
                          {componentType === 'rsf' && 'Required Stable Funding'}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculatedAmount)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Applied {formatPercent(factor)} factor
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

              {/* Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-700">
                        {records.length} Records
                      </span>
                      <span className="text-sm text-slate-600">
                        Total: {formatCurrency(records.reduce((sum, r) => sum + (r.outstanding_balance || 0), 0))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowColumnSettings(!showColumnSettings)}
                          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Columns
                        </button>

                        {showColumnSettings && (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-slate-200">
                              <p className="text-xs font-semibold text-slate-700 uppercase">Show/Hide Columns</p>
                            </div>
                            {Object.entries(columnLabels).map(([key, label]) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns[key as keyof typeof visibleColumns]}
                                  onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={exportToExcel}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export to CSV
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  {records.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-slate-200 rounded-lg">
                      <Database className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No source records found</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              {Object.entries(visibleColumns)
                                .filter(([_, visible]) => visible)
                                .map(([key]) => (
                                  <th
                                    key={key}
                                    className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap"
                                  >
                                    {columnLabels[key as keyof typeof columnLabels]}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {records.map((record) => (
                              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                {visibleColumns.product_id && (
                                  <td className="px-4 py-3 text-sm font-mono text-slate-900 whitespace-nowrap">
                                    {record.product_id}
                                  </td>
                                )}
                                {visibleColumns.product_name && (
                                  <td className="px-4 py-3 text-sm text-slate-900">
                                    {record.product_name}
                                  </td>
                                )}
                                {visibleColumns.product_category && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {record.product_category}
                                  </td>
                                )}
                                {visibleColumns.sub_product && (
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {record.sub_product || 'N/A'}
                                  </td>
                                )}
                                {visibleColumns.maturity_bucket && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {record.maturity_bucket}
                                  </td>
                                )}
                                {visibleColumns.counterparty_type && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {record.counterparty_type}
                                  </td>
                                )}
                                {visibleColumns.asset_class && (
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {record.asset_class || 'N/A'}
                                  </td>
                                )}
                                {visibleColumns.outstanding_balance && (
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                                    {formatCurrency(record.outstanding_balance)}
                                  </td>
                                )}
                                {visibleColumns.projected_cash_inflow && (
                                  <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right whitespace-nowrap">
                                    {formatCurrency(record.projected_cash_inflow)}
                                  </td>
                                )}
                                {visibleColumns.projected_cash_outflow && (
                                  <td className="px-4 py-3 text-sm font-semibold text-red-700 text-right whitespace-nowrap">
                                    {formatCurrency(record.projected_cash_outflow)}
                                  </td>
                                )}
                                {visibleColumns.is_hqla && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {record.is_hqla ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleColumns.hqla_level && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {record.hqla_level || 'N/A'}
                                  </td>
                                )}
                                {visibleColumns.haircut && (
                                  <td className="px-4 py-3 text-sm text-slate-600 text-right whitespace-nowrap">
                                    {formatPercent(record.haircut)}
                                  </td>
                                )}
                                {visibleColumns.runoff_rate && (
                                  <td className="px-4 py-3 text-sm text-slate-600 text-right whitespace-nowrap">
                                    {record.runoff_rate ? formatPercent(record.runoff_rate) : 'N/A'}
                                  </td>
                                )}
                                {visibleColumns.encumbered_amount && (
                                  <td className="px-4 py-3 text-sm text-slate-600 text-right whitespace-nowrap">
                                    {formatCurrency(record.encumbered_amount)}
                                  </td>
                                )}
                                {visibleColumns.currency && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {record.currency}
                                  </td>
                                )}
                                {visibleColumns.report_date && (
                                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                    {new Date(record.report_date).toLocaleDateString()}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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
