import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building2,
  Globe,
  Target,
  Database
} from 'lucide-react';
import { LCRView } from './regulatory/LCRView';
import { NSFRView } from './regulatory/NSFRView';
import { BalanceSheetView } from './regulatory/BalanceSheetView';
import { InterestRateRiskView } from './regulatory/InterestRateRiskView';
import { ResolutionPlanningView } from './regulatory/ResolutionPlanningView';
import { RegKView } from './regulatory/RegKView';
import { seedStateStreetData } from '../utils/seedStateStreetData';

interface ComplianceStatus {
  lcr_compliant: boolean;
  nsfr_compliant: boolean;
  latest_lcr: number | null;
  latest_nsfr: number | null;
  tier1_ratio: number | null;
  leverage_ratio: number | null;
}

export function RegulatoryDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<string>('overview');
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>({
    lcr_compliant: false,
    nsfr_compliant: false,
    latest_lcr: null,
    latest_nsfr: null,
    tier1_ratio: null,
    leverage_ratio: null,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    loadComplianceStatus();
  }, [user]);

  const loadComplianceStatus = async () => {
    if (!user) return;

    const [lcrResult, nsfrResult, balanceSheetResult] = await Promise.all([
      supabase
        .from('lcr_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('nsfr_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('balance_sheet_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const hasAnyData = lcrResult.data || nsfrResult.data || balanceSheetResult.data;
    setHasData(!!hasAnyData);

    console.log('Compliance Status Data:', {
      lcr: lcrResult.data,
      nsfr: nsfrResult.data,
      balanceSheet: balanceSheetResult.data,
      hasData: hasAnyData
    });

    setComplianceStatus({
      lcr_compliant: lcrResult.data?.is_compliant || false,
      nsfr_compliant: nsfrResult.data?.is_compliant || false,
      latest_lcr: lcrResult.data?.lcr_ratio || null,
      latest_nsfr: nsfrResult.data?.nsfr_ratio || null,
      tier1_ratio: balanceSheetResult.data?.tier1_capital_ratio || null,
      leverage_ratio: balanceSheetResult.data?.leverage_ratio || null,
    });

    setLoading(false);
  };

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      console.log('Seeding data for user:', user.id);
      const result = await seedStateStreetData(user.id);
      console.log('Seed result:', result);
      if (result.success) {
        await loadComplianceStatus();
        alert('State Street Corporation data loaded successfully!');
      } else {
        console.error('Seed errors:', result.errors || result.error);
        alert('Error loading data. Please check console for details.');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error loading data. Please check console for details.');
    }
    setSeeding(false);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return <div className="text-slate-600">Loading regulatory data...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-800 rounded-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Regulatory Compliance Dashboard</h1>
          <p className="text-sm text-slate-600">Category II Enhanced Prudential Standards</p>
        </div>
      </div>

      {activeView === 'overview' && (
        <>
          {!hasData && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">No Regulatory Data Found</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Load State Street Corporation's Q3 2024 regulatory metrics to explore the dashboard features with real institutional data.
                  </p>
                  <button
                    onClick={handleSeedData}
                    disabled={seeding}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Database className="w-4 h-4" />
                    {seeding ? 'Loading Data...' : 'Load State Street Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Regulatory Framework</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-300 mb-2">Primary Regulations:</p>
                <ul className="space-y-1 text-slate-100">
                  <li>• Regulation YY - Enhanced Prudential Standards</li>
                  <li>• Regulation QQ - Resolution Plans (165d)</li>
                  <li>• Regulation K - International Banking</li>
                  <li>• Basel III Liquidity Standards</li>
                </ul>
              </div>
              <div>
                <p className="text-slate-300 mb-2">Key Requirements:</p>
                <ul className="space-y-1 text-slate-100">
                  <li>• LCR ≥ 100% (Daily Monitoring)</li>
                  <li>• NSFR ≥ 100% (Quarterly Reporting)</li>
                  <li>• Annual CCAR/DFAST Stress Testing</li>
                  <li>• Biennial 165d Resolution Plans</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`rounded-xl shadow-sm p-6 border-2 ${
              complianceStatus.lcr_compliant
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  complianceStatus.lcr_compliant ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {complianceStatus.lcr_compliant ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-1">LCR (Reg YY)</p>
              <p className={`text-2xl font-bold ${
                complianceStatus.lcr_compliant ? 'text-green-800' : 'text-red-800'
              }`}>
                {formatPercent(complianceStatus.latest_lcr)}
              </p>
              <p className="text-xs text-slate-600 mt-2">Min Required: 100%</p>
            </div>

            <div className={`rounded-xl shadow-sm p-6 border-2 ${
              complianceStatus.nsfr_compliant
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  complianceStatus.nsfr_compliant ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {complianceStatus.nsfr_compliant ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-1">NSFR (Basel III)</p>
              <p className={`text-2xl font-bold ${
                complianceStatus.nsfr_compliant ? 'text-green-800' : 'text-red-800'
              }`}>
                {formatPercent(complianceStatus.latest_nsfr)}
              </p>
              <p className="text-xs text-slate-600 mt-2">Min Required: 100%</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Tier 1 Capital Ratio</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatPercent(complianceStatus.tier1_ratio)}
              </p>
              <p className="text-xs text-slate-600 mt-2">Category II: ≥ 8%</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Leverage Ratio</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatPercent(complianceStatus.leverage_ratio)}
              </p>
              <p className="text-xs text-slate-600 mt-2">Category II: ≥ 5%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Regulatory Views</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveView('lcr')}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">LCR Monitoring</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Daily liquidity coverage ratio tracking per FR 2052a reporting
                </p>
              </button>

              <button
                onClick={() => setActiveView('nsfr')}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">NSFR Analysis</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Net stable funding ratio and structural liquidity management
                </p>
              </button>

              <button
                onClick={() => setActiveView('balance-sheet')}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Balance Sheet</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Capital ratios, asset composition, and funding structure
                </p>
              </button>

              <button
                onClick={() => setActiveView('irr')}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Interest Rate Risk</h3>
                </div>
                <p className="text-sm text-slate-600">
                  NII and EVE sensitivity analysis per OCC guidance
                </p>
              </button>

              <button
                onClick={() => setActiveView('resolution')}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Resolution Planning</h3>
                </div>
                <p className="text-sm text-slate-600">
                  165d resolution plan metrics and TLAC requirements
                </p>
              </button>

              <button
                onClick={() => setActiveView('reg-k')}
                className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">International Banking</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Regulation K foreign exposures and cross-border operations
                </p>
              </button>
            </div>
          </div>
        </>
      )}

      {activeView === 'lcr' && <LCRView onBack={() => setActiveView('overview')} />}
      {activeView === 'nsfr' && <NSFRView onBack={() => setActiveView('overview')} />}
      {activeView === 'balance-sheet' && <BalanceSheetView onBack={() => setActiveView('overview')} />}
      {activeView === 'irr' && <InterestRateRiskView onBack={() => setActiveView('overview')} />}
      {activeView === 'resolution' && <ResolutionPlanningView onBack={() => setActiveView('overview')} />}
      {activeView === 'reg-k' && <RegKView onBack={() => setActiveView('overview')} />}
    </div>
  );
}
