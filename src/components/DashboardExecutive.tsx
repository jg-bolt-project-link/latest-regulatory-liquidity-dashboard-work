import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Droplets,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Database,
  BarChart3,
  FileText
} from 'lucide-react';
import { seedDashboardData, seedStateStreetData } from '../utils/seedStateStreetData';
import { seedFR2052aWithCalculations } from '../utils/seedFR2052aWithCalculations';
import { MetricCardWithQuality } from './shared/MetricCardWithQuality';

interface DashboardMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netLiquidity: number;
  lcrRatio: number | null;
  lcrSurplus: number | null;
  nsfrRatio: number | null;
  nsfrSurplus: number | null;
  tier1Ratio: number | null;
  rcapRatio: number | null;
  rcapSurplus: number | null;
  rcenRatio: number | null;
  rlapRatio: number | null;
  rlapSurplus: number | null;
  rlenRatio: number | null;
  cashGap: number;
  bindingCashGapHorizon: string;
  bindingStressScenario: string;
  bindingStressLiquidity: number | null;
  intradayPeak: number;
  bindingEveScenario: string;
  bindingEveChange: number | null;
  niiChangePercent: number | null;
  dataQualityScore: number;
}

interface DashboardExecutiveProps {
  onNavigate?: (view: string) => void;
}

export function DashboardExecutive({ onNavigate }: DashboardExecutiveProps = {}) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAssets: 0,
    totalLiabilities: 0,
    netLiquidity: 0,
    lcrRatio: null,
    lcrSurplus: null,
    nsfrRatio: null,
    nsfrSurplus: null,
    tier1Ratio: null,
    rcapRatio: null,
    rcapSurplus: null,
    rcenRatio: null,
    rlapRatio: null,
    rlapSurplus: null,
    rlenRatio: null,
    cashGap: 0,
    bindingCashGapHorizon: '30-day',
    bindingStressScenario: 'None',
    bindingStressLiquidity: null,
    intradayPeak: 0,
    bindingEveScenario: 'None',
    bindingEveChange: null,
    niiChangePercent: null,
    dataQualityScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;

    const [
      accountsResult,
      transactionsResult,
      lcrResult,
      nsfrResult,
      balanceSheetResult,
      irrbbResult,
      resolutionLiquidityResult,
      stressTestsResult,
      allIrrbbResults,
    ] = await Promise.all([
      supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(100),
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
      supabase
        .from('interest_rate_risk_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('resolution_liquidity_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('liquidity_stress_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(10),
      supabase
        .from('interest_rate_risk_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(10),
    ]);

    const accounts = accountsResult.data || [];
    const transactions = transactionsResult.data || [];

    const totalAssets = accounts
      .filter(acc => ['checking', 'savings', 'investment'].includes(acc.account_type))
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    const totalLiabilities = accounts
      .filter(acc => ['credit', 'loan'].includes(acc.account_type))
      .reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0);

    const totalInflow = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const cashGap = totalInflow - totalOutflow;
    const bindingCashGapHorizon = '30-day';

    const intradayPeak = totalAssets * 0.15;

    const lcrSurplus = lcrResult.data
      ? lcrResult.data.total_hqla - lcrResult.data.total_net_cash_outflows
      : null;

    const nsfrSurplus = nsfrResult.data
      ? nsfrResult.data.available_stable_funding - nsfrResult.data.required_stable_funding
      : null;

    const rcapRatio = resolutionLiquidityResult.data?.rcap_ratio || null;
    const rcapSurplus = resolutionLiquidityResult.data?.rcap_surplus_deficit || null;
    const rcenRatio = resolutionLiquidityResult.data?.rcen_ratio || null;
    const rlapRatio = resolutionLiquidityResult.data?.rlap_ratio || null;
    const rlapSurplus = resolutionLiquidityResult.data?.rlap_surplus_deficit || null;
    const rlenRatio = resolutionLiquidityResult.data?.rlen_ratio || null;

    const stressTests = stressTestsResult.data || [];
    let bindingStressScenario = 'None';
    let bindingStressLiquidity = null;
    if (stressTests.length > 0) {
      const sortedByLiquidity = [...stressTests].sort((a, b) => a.stressed_liquidity - b.stressed_liquidity);
      const mostStressed = sortedByLiquidity[0];
      bindingStressScenario = mostStressed.scenario_type === '30_day_short_term' ? '30-day' : '1-year';
      bindingStressLiquidity = mostStressed.stressed_liquidity;
    }

    const allIrrbb = allIrrbbResults.data || [];
    let bindingEveScenario = 'None';
    let bindingEveChange = null;
    if (allIrrbb.length > 0) {
      const sortedByEve = [...allIrrbb].sort((a, b) => Math.abs(b.eve_change_percent) - Math.abs(a.eve_change_percent));
      const mostNegativeEve = sortedByEve[0];
      bindingEveScenario = mostNegativeEve.scenario_type || 'Unknown';
      bindingEveChange = mostNegativeEve.eve_change_percent;
    }

    const niiChangePercent = irrbbResult.data?.nii_change_percent || null;

    const dataPoints = [
      accounts.length > 0,
      transactions.length > 0,
      lcrResult.data !== null,
      nsfrResult.data !== null,
      balanceSheetResult.data !== null,
    ];
    const dataQuality = (dataPoints.filter(Boolean).length / dataPoints.length) * 100;

    const hasAnyData = accounts.length > 0 || lcrResult.data || nsfrResult.data || balanceSheetResult.data;

    setHasData(hasAnyData);
    setMetrics({
      totalAssets,
      totalLiabilities,
      netLiquidity: totalAssets - totalLiabilities,
      lcrRatio: lcrResult.data?.lcr_ratio || null,
      lcrSurplus,
      nsfrRatio: nsfrResult.data?.nsfr_ratio || null,
      nsfrSurplus,
      tier1Ratio: balanceSheetResult.data?.tier1_capital_ratio || null,
      rcapRatio,
      rcapSurplus,
      rcenRatio,
      rlapRatio,
      rlapSurplus,
      rlenRatio,
      cashGap,
      bindingCashGapHorizon,
      bindingStressScenario,
      bindingStressLiquidity,
      intradayPeak,
      bindingEveScenario,
      bindingEveChange,
      niiChangePercent,
      dataQualityScore: dataQuality,
    });

    setLoading(false);
  };

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const [dashboardResult, regulatoryResult, fr2052aResult] = await Promise.all([
        seedDashboardData(user.id),
        seedStateStreetData(user.id),
        seedFR2052aWithCalculations(user.id)
      ]);

      if (dashboardResult.success && regulatoryResult.success && fr2052aResult.success) {
        await loadMetrics();
        const fr2052aStats = fr2052aResult.results;
        alert(
          `All data loaded successfully!\n\n` +
          `FR 2052a Data Generated:\n` +
          `- ${fr2052aStats.totalRecords.toLocaleString()} line items\n` +
          `- ${fr2052aStats.totalEntities} entities\n` +
          `- ${fr2052aStats.totalPeriods} reporting periods\n` +
          `- ${fr2052aStats.lcrCalculations.length} LCR calculations\n` +
          `- ${fr2052aStats.nsfrCalculations.length} NSFR calculations`
        );
      } else {
        console.error('Seed errors:', { dashboardResult, regulatoryResult, fr2052aResult });
        alert('Error loading data. Check console for details.');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error loading data. Check console for details.');
    }
    setSeeding(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return <div className="text-slate-600">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
            <p className="text-sm text-slate-600">Comprehensive liquidity and regulatory overview</p>
          </div>
        </div>
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg font-semibold"
          title="Generate sample data including FR 2052a, LCR, and NSFR calculations"
        >
          <Database className="w-5 h-5" />
          {seeding ? 'Generating Data...' : 'Seed Sample Data'}
        </button>
      </div>

      {!hasData && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">No Data Found</h3>
              <p className="text-sm text-slate-600">
                Click <span className="font-semibold text-blue-700">"Seed Sample Data"</span> above to generate comprehensive State Street Corporation sample data including FR 2052a reporting, LCR/NSFR calculations, and all dashboard metrics.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => onNavigate?.('balance-sheet')}
          className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Balance Sheet</span>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-3">Balance Sheet & IRRBB</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Total Assets</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.totalAssets)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Total Equity</span>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(metrics.netLiquidity)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Binding EVE ({metrics.bindingEveScenario})</span>
              <span className={`text-sm font-semibold ${metrics.bindingEveChange && metrics.bindingEveChange < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {metrics.bindingEveChange !== null ? formatPercent(metrics.bindingEveChange) : 'N/A'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-700">NII Change</span>
                <span className={`text-sm font-bold ${metrics.niiChangePercent && metrics.niiChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.niiChangePercent !== null ? formatPercent(metrics.niiChangePercent) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.('capital-metrics')}
          className={`rounded-xl shadow-sm p-6 border-2 hover:shadow-md transition-all text-left ${
            (metrics.tier1Ratio && metrics.tier1Ratio >= 0.08) && (metrics.rcapSurplus && metrics.rcapSurplus >= 0)
              ? 'bg-green-50 border-green-300 hover:border-green-500'
              : 'bg-amber-50 border-amber-300 hover:border-amber-500'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Capital Metrics</span>
          </div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Regulatory & Resolution Capital</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Tier 1 Ratio</span>
              <span className={`text-sm font-semibold ${metrics.tier1Ratio && metrics.tier1Ratio >= 0.08 ? 'text-green-600' : 'text-amber-600'}`}>
                {metrics.tier1Ratio !== null ? formatPercent(metrics.tier1Ratio) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">RCAP Surplus</span>
              <span className={`text-sm font-semibold ${metrics.rcapSurplus && metrics.rcapSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.rcapSurplus !== null ? formatCurrency(metrics.rcapSurplus) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">RCEN</span>
              <span className="text-sm font-semibold text-slate-900">
                {metrics.rcenRatio !== null ? formatPercent(metrics.rcenRatio) : 'N/A'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {(metrics.tier1Ratio && metrics.tier1Ratio >= 0.08) && (metrics.rcapSurplus && metrics.rcapSurplus >= 0) ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-xs font-medium text-slate-700">
                  {(metrics.tier1Ratio && metrics.tier1Ratio >= 0.08) && (metrics.rcapSurplus && metrics.rcapSurplus >= 0) ? 'Well Capitalized' : 'Monitor'}
                </span>
              </div>
            </div>
          </div>
        </button>

        <MetricCardWithQuality
          metricName="Liquidity Coverage Ratio (LCR)"
          targetTable="lcr_metrics"
          targetColumn="lcr_ratio"
          dataSource="Analytics"
        >
          <button
            onClick={() => onNavigate?.('liquidity-metrics')}
            className={`rounded-xl shadow-sm p-6 border-2 hover:shadow-md transition-all text-left w-full ${
              (metrics.lcrRatio && metrics.lcrRatio >= 1.0) && (metrics.nsfrRatio && metrics.nsfrRatio >= 1.0) && (metrics.rlapSurplus && metrics.rlapSurplus >= 0)
                ? 'bg-green-50 border-green-300 hover:border-green-500'
                : 'bg-amber-50 border-amber-300 hover:border-amber-500'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Droplets className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Liquidity Metrics</span>
            </div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Regulatory & Resolution Liquidity</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">LCR</span>
                <span className={`text-sm font-semibold ${metrics.lcrRatio && metrics.lcrRatio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.lcrRatio !== null ? formatPercent(metrics.lcrRatio) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">NSFR</span>
                <span className={`text-sm font-semibold ${metrics.nsfrRatio && metrics.nsfrRatio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.nsfrRatio !== null ? formatPercent(metrics.nsfrRatio) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">RLAP Surplus</span>
                <span className={`text-sm font-semibold ${metrics.rlapSurplus && metrics.rlapSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.rlapSurplus !== null ? formatCurrency(metrics.rlapSurplus) : 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {(metrics.lcrRatio && metrics.lcrRatio >= 1.0) && (metrics.nsfrRatio && metrics.nsfrRatio >= 1.0) ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-xs font-medium text-slate-700">
                    {(metrics.lcrRatio && metrics.lcrRatio >= 1.0) && (metrics.nsfrRatio && metrics.nsfrRatio >= 1.0) ? 'Compliant' : 'Monitor'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </MetricCardWithQuality>

        <button
          onClick={() => onNavigate?.('cash-flow')}
          className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Cash Flows</span>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-3">Cash Flow Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Cash Gap (30-day)</span>
              <span className={`text-sm font-semibold ${metrics.cashGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.cashGap)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Net Liquidity (Point-in-Time)</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.netLiquidity)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-700">Binding Gap Horizon</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {metrics.bindingCashGapHorizon}
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.('intraday-liquidity')}
          className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Intraday</span>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-3">Intraday Liquidity</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Peak Requirement</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.intradayPeak)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Available</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.totalAssets)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-700">Coverage</span>
                <span className="text-base font-bold text-green-600">
                  {metrics.totalAssets > 0 ? `${((metrics.totalAssets / (metrics.intradayPeak || 1)) * 100).toFixed(0)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.('fr2052a')}
          className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Regulatory Reporting</span>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-3">FR 2052a</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Report Status</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                Current
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Last Submission</span>
              <span className="text-sm font-semibold text-slate-900">Today</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-slate-700">Quality Validated</span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.('data-quality')}
          className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left md:col-span-2 lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900">Data Quality Assessment</h3>
                <p className="text-xs text-slate-500">Coverage across all data sources - Click for details</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">{metrics.dataQualityScore.toFixed(0)}%</p>
              <p className="text-xs text-slate-600 mt-1">Overall Score</p>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${
                metrics.dataQualityScore >= 80 ? 'bg-green-500' :
                metrics.dataQualityScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${metrics.dataQualityScore}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${metrics.totalAssets > 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
              <p className="text-xs text-slate-600">Accounts</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${metrics.cashGap !== 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
              <p className="text-xs text-slate-600">Transactions</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${metrics.lcrRatio !== null ? 'bg-green-500' : 'bg-slate-300'}`} />
              <p className="text-xs text-slate-600">LCR Data</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${metrics.nsfrRatio !== null ? 'bg-green-500' : 'bg-slate-300'}`} />
              <p className="text-xs text-slate-600">NSFR Data</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${metrics.tier1Ratio !== null ? 'bg-green-500' : 'bg-slate-300'}`} />
              <p className="text-xs text-slate-600">Balance Sheet</p>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
}
