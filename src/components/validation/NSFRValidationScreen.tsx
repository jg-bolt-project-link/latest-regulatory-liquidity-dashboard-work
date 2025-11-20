import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NSFRValidation {
  id: string;
  submission_id: string;
  legal_entity_id: string;
  report_date: string;
  validation_timestamp: string;

  capital_asf_calculated: number;
  capital_asf_validation_status: string;
  capital_asf_variance: number;

  retail_deposits_asf_calculated: number;
  retail_deposits_asf_validation_status: string;
  retail_deposits_asf_variance: number;

  wholesale_funding_asf_calculated: number;
  wholesale_funding_asf_validation_status: string;
  wholesale_funding_asf_variance: number;

  other_liabilities_asf_calculated: number;
  total_asf_calculated: number;
  asf_validation_status: string;
  asf_variance: number;

  level1_assets_rsf_calculated: number;
  level2a_assets_rsf_calculated: number;
  level2b_assets_rsf_calculated: number;
  loans_rsf_calculated: number;
  other_assets_rsf_calculated: number;
  total_rsf_calculated: number;
  rsf_validation_status: string;
  rsf_variance: number;

  nsfr_ratio_calculated: number;
  nsfr_validation_status: string;
  nsfr_variance: number;

  overall_validation_status: string;
  notes: string | null;
}

interface NSFRValidationScreenProps {
  submissionId: string;
}

export function NSFRValidationScreen({ submissionId }: NSFRValidationScreenProps) {
  const [validation, setValidation] = useState<NSFRValidation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValidation();
  }, [submissionId]);

  const loadValidation = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('nsfr_calculation_validations')
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
    return <div className="text-center py-12 text-slate-600">Loading NSFR validation details...</div>;
  }

  if (!validation) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">NSFR Validation Not Yet Performed</h3>
        <p className="text-sm text-slate-600 mb-4">
          NSFR calculation validation has not been executed for this submission.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <p className="text-sm font-medium text-blue-900 mb-2">To execute NSFR validation:</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to the <span className="font-semibold">Submissions</span> tab</li>
            <li>Find this submission in the table</li>
            <li>Click the <span className="font-semibold">Execute Validations</span> button</li>
            <li>Wait for validation to complete (~2-3 seconds)</li>
            <li>Return here to view NSFR validation results</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">NSFR Calculation Validation</h2>
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
            <p className="text-sm text-slate-600">NSFR Ratio</p>
            <p className={`text-lg font-semibold ${getStatusColor(validation.nsfr_validation_status)}`}>
              {formatPercent(validation.nsfr_ratio_calculated)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Compliance Status</p>
            <p className={`text-lg font-semibold ${validation.nsfr_ratio_calculated >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
              {validation.nsfr_ratio_calculated >= 1.0 ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Stable Funding (ASF) */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-green-50 px-6 py-4 border-b border-green-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Available Stable Funding (ASF)
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Capital Component */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Capital (100% ASF Factor)</h4>
              {getStatusIcon(validation.capital_asf_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Calculated Amount</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.capital_asf_calculated)}</p>
              </div>
              <div>
                <p className="text-slate-600">Variance</p>
                <p className={`text-lg font-semibold ${Math.abs(validation.capital_asf_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.capital_asf_variance)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Includes: Tier 1 & Tier 2 capital, other preferred stock
            </p>
          </div>

          {/* Retail Deposits */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Retail Deposits (90-95% ASF Factor)</h4>
              {getStatusIcon(validation.retail_deposits_asf_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Calculated Amount</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.retail_deposits_asf_calculated)}</p>
              </div>
              <div>
                <p className="text-slate-600">Variance</p>
                <p className={`text-lg font-semibold ${Math.abs(validation.retail_deposits_asf_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.retail_deposits_asf_variance)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Stable retail & small business deposits with high retention
            </p>
          </div>

          {/* Wholesale Funding */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Wholesale Funding (50-100% ASF Factor)</h4>
              {getStatusIcon(validation.wholesale_funding_asf_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Calculated Amount</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.wholesale_funding_asf_calculated)}</p>
              </div>
              <div>
                <p className="text-slate-600">Variance</p>
                <p className={`text-lg font-semibold ${Math.abs(validation.wholesale_funding_asf_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.wholesale_funding_asf_variance)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Long-term wholesale funding, operational deposits
            </p>
          </div>

          {/* Other Liabilities */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900">Other Liabilities</h4>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm">
              <p className="text-slate-600 mb-2">Calculated Amount</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(validation.other_liabilities_asf_calculated)}</p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Derivatives, net stable funding liabilities
            </p>
          </div>

          {/* Total ASF */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-lg">Total Available Stable Funding</h4>
              {getStatusIcon(validation.asf_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Calculated Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(validation.total_asf_calculated)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Variance</p>
                <p className={`text-2xl font-bold ${Math.abs(validation.asf_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.asf_variance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Required Stable Funding (RSF) */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            Required Stable Funding (RSF)
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Level 1 Assets RSF */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Level 1 Assets</h4>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(validation.level1_assets_rsf_calculated)}</p>
              <p className="text-xs text-slate-500 mt-2">0-5% RSF Factor</p>
            </div>

            {/* Level 2A Assets RSF */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Level 2A Assets</h4>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(validation.level2a_assets_rsf_calculated)}</p>
              <p className="text-xs text-slate-500 mt-2">15% RSF Factor</p>
            </div>

            {/* Level 2B Assets RSF */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Level 2B Assets</h4>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(validation.level2b_assets_rsf_calculated)}</p>
              <p className="text-xs text-slate-500 mt-2">50% RSF Factor</p>
            </div>

            {/* Loans RSF */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Loans</h4>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(validation.loans_rsf_calculated)}</p>
              <p className="text-xs text-slate-500 mt-2">50-85% RSF Factor</p>
            </div>
          </div>

          {/* Other Assets */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Other Assets</h4>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(validation.other_assets_rsf_calculated)}</p>
            <p className="text-xs text-slate-500 mt-2">Operational deposits, derivatives, other assets</p>
          </div>

          {/* Total RSF */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-lg">Total Required Stable Funding</h4>
              {getStatusIcon(validation.rsf_validation_status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Calculated Amount</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(validation.total_rsf_calculated)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Variance</p>
                <p className={`text-2xl font-bold ${Math.abs(validation.rsf_variance) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(validation.rsf_variance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final NSFR */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Percent className="h-5 w-5 text-slate-600" />
            Final NSFR Calculation
          </h3>
        </div>

        <div className="p-6">
          <div className="bg-slate-900 text-white rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-slate-300 mb-2">Net Stable Funding Ratio</p>
              <p className="text-5xl font-bold mb-3">{formatPercent(validation.nsfr_ratio_calculated)}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {validation.nsfr_ratio_calculated >= 1.0 ? (
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
                Formula: Available Stable Funding ÷ Required Stable Funding
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {formatCurrency(validation.total_asf_calculated)} ÷ {formatCurrency(validation.total_rsf_calculated)}
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
