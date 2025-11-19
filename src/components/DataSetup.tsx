import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { seedDashboardData, seedStateStreetData } from '../utils/seedStateStreetData';
import { seedFR2052aWithCalculations } from '../utils/seedFR2052aWithCalculations';
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  FileText,
  BarChart3,
  Shield,
  Droplets,
  Clock
} from 'lucide-react';

interface ValidationResult {
  category: string;
  expected: number;
  actual: number;
  passed: boolean;
  message: string;
}

export function DataSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const validateGeneratedData = async (): Promise<ValidationResult[]> => {
    if (!user) return [];

    const results: ValidationResult[] = [];

    const { count: fr2052aCount } = await supabase
      .from('fr2052a_data_rows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    results.push({
      category: 'FR 2052a Data Rows',
      expected: 6000,
      actual: fr2052aCount || 0,
      passed: (fr2052aCount || 0) >= 1000,
      message: fr2052aCount && fr2052aCount >= 1000
        ? `✓ Generated ${fr2052aCount.toLocaleString()} line items`
        : `✗ Expected at least 1,000 rows, found ${fr2052aCount || 0}`
    });

    const { count: lcrCount } = await supabase
      .from('fr2052a_lcr_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    results.push({
      category: 'FR2052a-Dependent LCR',
      expected: 12,
      actual: lcrCount || 0,
      passed: (lcrCount || 0) >= 6,
      message: lcrCount && lcrCount >= 6
        ? `✓ Generated ${lcrCount} FR2052a-dependent LCR calculations`
        : `✗ Expected at least 6 calculations, found ${lcrCount || 0}`
    });

    const { count: nsfrCount } = await supabase
      .from('fr2052a_nsfr_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    results.push({
      category: 'FR2052a-Dependent NSFR',
      expected: 12,
      actual: nsfrCount || 0,
      passed: (nsfrCount || 0) >= 6,
      message: nsfrCount && nsfrCount >= 6
        ? `✓ Generated ${nsfrCount} FR2052a-dependent NSFR calculations`
        : `✗ Expected at least 6 calculations, found ${nsfrCount || 0}`
    });

    const { count: entitiesCount } = await supabase
      .from('legal_entities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    results.push({
      category: 'Legal Entities',
      expected: 2,
      actual: entitiesCount || 0,
      passed: (entitiesCount || 0) >= 1,
      message: entitiesCount && entitiesCount >= 1
        ? `✓ Found ${entitiesCount} legal entities`
        : `✗ Expected at least 1 entity, found ${entitiesCount || 0}`
    });

    const { count: balanceSheetCount } = await supabase
      .from('balance_sheet_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    results.push({
      category: 'Balance Sheet Data',
      expected: 100,
      actual: balanceSheetCount || 0,
      passed: (balanceSheetCount || 0) >= 10,
      message: balanceSheetCount && balanceSheetCount >= 10
        ? `✓ Generated ${balanceSheetCount} balance sheet records`
        : `✗ Expected at least 10 records, found ${balanceSheetCount || 0}`
    });

    const { data: lcrData } = await supabase
      .from('fr2052a_lcr_metrics')
      .select('lcr_ratio')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      category: 'FR2052a LCR Ratio',
      expected: 1,
      actual: lcrData?.lcr_ratio ? 1 : 0,
      passed: lcrData?.lcr_ratio !== null && lcrData?.lcr_ratio !== undefined,
      message: lcrData?.lcr_ratio
        ? `✓ Latest FR2052a LCR ratio: ${(lcrData.lcr_ratio * 100).toFixed(2)}%`
        : `✗ FR2052a LCR ratio not calculated`
    });

    const { data: nsfrData } = await supabase
      .from('fr2052a_nsfr_metrics')
      .select('nsfr_ratio')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      category: 'FR2052a NSFR Ratio',
      expected: 1,
      actual: nsfrData?.nsfr_ratio ? 1 : 0,
      passed: nsfrData?.nsfr_ratio !== null && nsfrData?.nsfr_ratio !== undefined,
      message: nsfrData?.nsfr_ratio
        ? `✓ Latest FR2052a NSFR ratio: ${(nsfrData.nsfr_ratio * 100).toFixed(2)}%`
        : `✗ FR2052a NSFR ratio not calculated`
    });

    return results;
  };

  const handleGenerateAllData = async () => {
    if (!user) return;
    setLoading(true);
    setShowResults(false);
    setValidationResults([]);

    try {
      console.log('Step 1: Creating legal entities and base data...');
      const regulatoryResult = await seedStateStreetData(user.id);
      if (!regulatoryResult.success) {
        console.error('Failed to create legal entities:', regulatoryResult);
        alert('Error creating legal entities. Check console for details.');
        setLoading(false);
        return;
      }

      console.log('Step 2: Generating FR 2052a data and calculations...');
      const fr2052aResult = await seedFR2052aWithCalculations(user.id);
      console.log('FR 2052a generation result:', fr2052aResult);

      if (!fr2052aResult.success) {
        console.error('Failed to generate FR 2052a data:', fr2052aResult);
        alert(`Error generating FR 2052a data:\n${fr2052aResult.error || 'Unknown error'}\n\nCheck console for details.`);
        setLoading(false);
        return;
      }

      console.log('✓ FR 2052a data generation completed successfully');

      console.log('Step 3: Generating dashboard data...');
      const dashboardResult = await seedDashboardData(user.id);
      if (!dashboardResult.success) {
        console.error('Failed to generate dashboard data:', dashboardResult);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const validation = await validateGeneratedData();
      setValidationResults(validation);
      setLastGenerated(new Date().toLocaleString());
      setShowResults(true);

      const allPassed = validation.every(r => r.passed);
      if (allPassed) {
        alert('✓ All data generated and validated successfully!');
      } else {
        const failures = validation.filter(r => !r.passed);
        alert(
          `⚠ Data generated but validation issues found:\n\n` +
          failures.map(f => f.message).join('\n')
        );
      }
    } catch (error) {
      console.error('Error generating data:', error);
      alert('Error generating data. Check console for details.');
    }

    setLoading(false);
  };

  const handleRefreshDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setShowResults(false);

    try {
      const result = await seedDashboardData(user.id);

      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const validation = await validateGeneratedData();
        setValidationResults(validation);
        setLastGenerated(new Date().toLocaleString());
        setShowResults(true);

        alert('✓ Dashboard data refreshed successfully!');
      } else {
        console.error('Refresh error:', result);
        alert('Error refreshing data. Check console for details.');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Error refreshing data. Check console for details.');
    }

    setLoading(false);
  };

  const totalPassed = validationResults.filter(r => r.passed).length;
  const totalChecks = validationResults.length;
  const allPassed = totalChecks > 0 && totalPassed === totalChecks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Setup</h1>
        <p className="text-sm text-slate-600">Generate and validate sample data for all dashboards and reports</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Getting Started</h3>
            <p className="text-sm text-slate-700 mb-4">
              Use the buttons below to generate comprehensive sample data. The system will automatically validate
              that all data was created correctly and populate all dashboards with realistic institutional data.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Seed Sample FR 2052a Data</strong> - Generates 6,000+ FR 2052a line items, LCR/NSFR calculations for 6 periods</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Refresh Dashboard Data</strong> - Regenerates balance sheet, capital, and liquidity metrics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Seed Sample FR 2052a Data</h3>
              <p className="text-sm text-slate-600">Complete dataset generation with validation</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-slate-700">This will generate:</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                FR 2052a line items (~6,000+ records)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                LCR calculations (12 data points)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                NSFR calculations (12 data points)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Legal entities (2 entities)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                All regulatory metrics
              </li>
            </ul>
          </div>

          <button
            onClick={handleGenerateAllData}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating & Validating...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Generate All Data
              </>
            )}
          </button>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Refresh Dashboard Data</h3>
              <p className="text-sm text-slate-600">Update existing metrics and calculations</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-slate-700">This will refresh:</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Balance sheet data
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Capital metrics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Liquidity positions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Risk metrics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Dashboard summaries
              </li>
            </ul>
          </div>

          <button
            onClick={handleRefreshDashboardData}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 shadow-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>

      {showResults && validationResults.length > 0 && (
        <div className={`border-2 rounded-xl p-6 ${
          allPassed
            ? 'bg-green-50 border-green-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-lg ${
              allPassed ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {allPassed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg mb-1 ${
                allPassed ? 'text-green-900' : 'text-amber-900'
              }`}>
                {allPassed ? '✓ Data Generation Successful' : '⚠ Data Generation Completed with Issues'}
              </h3>
              <p className={`text-sm ${
                allPassed ? 'text-green-700' : 'text-amber-700'
              }`}>
                Passed {totalPassed} of {totalChecks} validation checks
                {lastGenerated && ` · Last generated: ${lastGenerated}`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {validationResults.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  result.passed
                    ? 'bg-white border border-green-200'
                    : 'bg-white border border-amber-300'
                }`}
              >
                {result.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{result.category}</div>
                  <div className="text-sm text-slate-600">{result.message}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {result.actual.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    of {result.expected.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allPassed && (
            <div className="mt-6 bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-slate-900 mb-3">Ready to explore:</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>FR 2052a Report</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>Liquidity Metrics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Capital Metrics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Balance Sheet</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Intraday Liquidity</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Data Quality</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
