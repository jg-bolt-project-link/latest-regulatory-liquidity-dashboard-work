import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LCRValidation {
  id: string;
  submission_id: string;
  legal_entity_id: string;
  report_date: string;
  validation_timestamp: string;

  level1_assets_calculated: number;
  level1_validation_status: string;
  level1_variance: number;

  level2a_assets_calculated: number;
  level2a_validation_status: string;
  level2a_variance: number;
  level2a_cap_applied: boolean;
  level2a_cap_amount: number;

  level2b_assets_calculated: number;
  level2b_validation_status: string;
  level2b_variance: number;
  level2b_cap_applied: boolean;
  level2b_cap_amount: number;

  total_hqla_calculated: number;
  hqla_validation_status: string;
  hqla_variance: number;

  retail_outflows_calculated: number;
  wholesale_outflows_calculated: number;
  secured_funding_outflows_calculated: number;
  derivatives_outflows_calculated: number;
  other_outflows_calculated: number;
  total_outflows_calculated: number;
  outflows_validation_status: string;

  total_inflows_calculated: number;
  capped_inflows_calculated: number;
  inflow_cap_applied: boolean;
  inflows_validation_status: string;

  net_cash_outflows_calculated: number;
  nco_validation_status: string;
  nco_variance: number;

  lcr_ratio_calculated: number;
  lcr_validation_status: string;
  lcr_variance: number;

  overall_validation_status: string;
  notes: string | null;
}

interface LCRValidationScreenProps {
  submissionId: string;
}

export function LCRValidationScreen({ submissionId }: LCRValidationScreenProps) {
  const [validation, setValidation] = useState<LCRValidation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValidation();
  }, [submissionId]);

  const loadValidation = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lcr_calculation_validations')
      .select('*')
      .eq('submission_id', submissionId)
      .order('validation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setValidation(data);
    setLoading(false);
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
        <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No LCR Validation Found</h3>
        <p className="text-sm text-slate-600">LCR calculation validation has not been performed for this submission</p>
      </div>
    );
  }

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

      {/* HQLA Components */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            High-Quality Liquid Assets (HQLA)
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Level 1 Assets */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Level 1 Assets</h4>
              {getStatusIcon(validation.level1_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Calculated Amount</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.level1_assets_calculated)}</p>
              </div>
              <div>
                <p className="text-slate-600">Variance</p>
                <p className={`text-lg font-semibold ${Math.abs(validation.level1_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.level1_variance)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Includes: Cash, Central Bank reserves, Government securities
            </p>
          </div>

          {/* Level 2A Assets */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Level 2A Assets</h4>
              {getStatusIcon(validation.level2a_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Calculated Amount</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.level2a_assets_calculated)}</p>
              </div>
              <div>
                <p className="text-slate-600">Variance</p>
                <p className={`text-lg font-semibold ${Math.abs(validation.level2a_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.level2a_variance)}
                </p>
              </div>
            </div>
            {validation.level2a_cap_applied && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-800">
                  <strong>Cap Applied:</strong> Level 2A assets capped at {formatCurrency(validation.level2a_cap_amount)} (66.67% of Level 1)
                </p>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Includes: High-quality corporate bonds, covered bonds (85% haircut)
            </p>
          </div>

          {/* Level 2B Assets */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Level 2B Assets</h4>
              {getStatusIcon(validation.level2b_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Calculated Amount</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.level2b_assets_calculated)}</p>
              </div>
              <div>
                <p className="text-slate-600">Variance</p>
                <p className={`text-lg font-semibold ${Math.abs(validation.level2b_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.level2b_variance)}
                </p>
              </div>
            </div>
            {validation.level2b_cap_applied && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-800">
                  <strong>Cap Applied:</strong> Level 2B assets capped at {formatCurrency(validation.level2b_cap_amount)} (17.65% of Level 1)
                </p>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Includes: Lower-rated corporate bonds, equity securities (50% haircut)
            </p>
          </div>

          {/* Total HQLA */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-lg">Total HQLA</h4>
              {getStatusIcon(validation.hqla_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Calculated Amount</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(validation.total_hqla_calculated)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Variance</p>
                <p className={`text-2xl font-bold ${Math.abs(validation.hqla_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.hqla_variance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Outflows */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            Cash Outflows (30-Day Period)
          </h3>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-700">Retail Deposit Outflows</span>
            <span className="font-semibold text-slate-900">{formatCurrency(validation.retail_outflows_calculated)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-700">Wholesale Funding Outflows</span>
            <span className="font-semibold text-slate-900">{formatCurrency(validation.wholesale_outflows_calculated)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-700">Secured Funding Outflows</span>
            <span className="font-semibold text-slate-900">{formatCurrency(validation.secured_funding_outflows_calculated)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-700">Derivatives Outflows</span>
            <span className="font-semibold text-slate-900">{formatCurrency(validation.derivatives_outflows_calculated)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-700">Other Contractual Outflows</span>
            <span className="font-semibold text-slate-900">{formatCurrency(validation.other_outflows_calculated)}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-3">
            <span className="font-bold text-slate-900">Total Cash Outflows</span>
            <span className="text-xl font-bold text-red-600">{formatCurrency(validation.total_outflows_calculated)}</span>
          </div>
        </div>
      </div>

      {/* Cash Inflows */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-green-50 px-6 py-4 border-b border-green-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Cash Inflows (30-Day Period)
          </h3>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-700">Total Inflows (Uncapped)</span>
            <span className="font-semibold text-slate-900">{formatCurrency(validation.total_inflows_calculated)}</span>
          </div>
          {validation.inflow_cap_applied && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Inflow Cap Applied:</strong> Inflows are capped at 75% of total outflows per LCR regulations
              </p>
            </div>
          )}
          <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg mt-3">
            <span className="font-bold text-slate-900">Capped Inflows (Used in LCR)</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(validation.capped_inflows_calculated)}</span>
          </div>
        </div>
      </div>

      {/* Net Cash Outflows & Final LCR */}
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
          </div>

          <div className="bg-slate-900 text-white rounded-lg p-6">
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
              <p className="text-xs text-slate-300">
                Formula: Total HQLA ÷ Net Cash Outflows
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {formatCurrency(validation.total_hqla_calculated)} ÷ {formatCurrency(validation.net_cash_outflows_calculated)}
              </p>
              <p className="text-xs text-slate-400 mt-4">
                Regulatory Minimum: 100%
              </p>
            </div>
          </div>
        </div>
      </div>

      {validation.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Validation Notes</h4>
          <p className="text-sm text-slate-700">{validation.notes}</p>
        </div>
      )}
    </div>
  );
}
