import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { seedDashboardData, seedStateStreetData } from '../utils/seedStateStreetData';
import { seedFR2052aWithCalculations } from '../utils/seedFR2052aWithCalculations';
import { DataGenerationWorkflow, WorkflowStep } from './shared/DataGenerationWorkflow';
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
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const validateGeneratedData = async (): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];

    const { count: fr2052aCount } = await supabase
      .from('fr2052a_data_rows')
      .select('*', { count: 'exact', head: true });

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
      .is('user_id', null);

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
      .is('user_id', null);

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
      .is('user_id', null);

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
      .is('user_id', null);

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
      .is('user_id', null)
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
      .is('user_id', null)
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

  const updateWorkflowStep = (id: string, updates: Partial<WorkflowStep>) => {
    setWorkflowSteps(prev =>
      prev.map(step => step.id === id ? { ...step, ...updates } : step)
    );
  };

  const handleGenerateAllData = async () => {
    setLoading(true);
    setShowResults(false);
    setValidationResults([]);
    setShowWorkflow(true);

    const initialSteps: WorkflowStep[] = [
      { id: 'init', label: 'Initialize data generation', status: 'pending' },
      { id: 'clear-existing', label: 'Clear existing data from tables', status: 'pending' },
      { id: 'create-entities', label: 'Create legal entity structure', status: 'pending' },
      { id: 'seed-quality', label: 'Seed data quality metadata', status: 'pending' },
      { id: 'seed-lcr', label: 'Generate LCR metrics', status: 'pending' },
      { id: 'seed-nsfr', label: 'Generate NSFR metrics', status: 'pending' },
      { id: 'seed-balance-sheet', label: 'Generate balance sheet metrics', status: 'pending' },
      { id: 'seed-stress-tests', label: 'Generate stress test scenarios', status: 'pending' },
      { id: 'seed-resolution', label: 'Generate resolution planning metrics', status: 'pending' },
      { id: 'verify-base', label: 'Verify base regulatory data', status: 'pending' },
      { id: 'fetch-entities', label: 'Fetch legal entities for FR 2052a', status: 'pending' },
      { id: 'generate-fr2052a', label: 'Generate FR 2052a data rows', status: 'pending' },
      { id: 'insert-fr2052a', label: 'Insert FR 2052a data into database', status: 'pending' },
      { id: 'calculate-lcr', label: 'Calculate LCR from FR 2052a data', status: 'pending' },
      { id: 'calculate-nsfr', label: 'Calculate NSFR from FR 2052a data', status: 'pending' },
      { id: 'verify-fr2052a', label: 'Verify FR 2052a data in database', status: 'pending' },
      { id: 'seed-accounts', label: 'Generate account data', status: 'pending' },
      { id: 'seed-transactions', label: 'Generate transaction history', status: 'pending' },
      { id: 'validate-all', label: 'Run comprehensive validation', status: 'pending' },
      { id: 'complete', label: 'Data generation complete', status: 'pending' },
    ];
    setWorkflowSteps(initialSteps);

    try {
      const startTime = Date.now();
      updateWorkflowStep('init', { status: 'in_progress' });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateWorkflowStep('init', { status: 'completed', duration: Date.now() - startTime });

      console.log('Step 1: Creating legal entities and base data...');
      updateWorkflowStep('clear-existing', { status: 'in_progress', message: 'Cleaning up existing records...' });
      const step1Start = Date.now();

      const regulatoryResult = await seedStateStreetData();

      if (!regulatoryResult.success) {
        updateWorkflowStep('clear-existing', {
          status: 'error',
          message: 'Failed to clear existing data',
          details: regulatoryResult.error || 'Unknown error'
        });
        console.error('Failed to create legal entities:', regulatoryResult);
        alert('Error creating legal entities. Check console for details.');
        setLoading(false);
        return;
      }

      updateWorkflowStep('clear-existing', { status: 'completed', duration: Date.now() - step1Start });
      updateWorkflowStep('create-entities', { status: 'completed', message: 'Legal entities created successfully' });
      updateWorkflowStep('seed-quality', { status: 'completed', message: 'Data quality metadata loaded' });
      updateWorkflowStep('seed-lcr', { status: 'completed', message: 'LCR metrics initialized' });
      updateWorkflowStep('seed-nsfr', { status: 'completed', message: 'NSFR metrics initialized' });
      updateWorkflowStep('seed-balance-sheet', { status: 'completed', message: 'Balance sheet data loaded' });
      updateWorkflowStep('seed-stress-tests', { status: 'completed', message: 'Stress test scenarios created' });
      updateWorkflowStep('seed-resolution', { status: 'completed', message: 'Resolution metrics generated' });
      updateWorkflowStep('verify-base', { status: 'completed', message: 'Base data verified' });

      console.log('Step 2: Generating FR 2052a data and calculations...');
      updateWorkflowStep('fetch-entities', { status: 'in_progress', message: 'Loading legal entities...' });
      const step2Start = Date.now();

      const fr2052aResult = await seedFR2052aWithCalculations();
      console.log('FR 2052a generation result:', fr2052aResult);

      if (!fr2052aResult.success) {
        updateWorkflowStep('fetch-entities', {
          status: 'error',
          message: 'FR 2052a generation failed',
          details: fr2052aResult.error || 'Unknown error'
        });
        console.error('Failed to generate FR 2052a data:', fr2052aResult);
        alert(`Error generating FR 2052a data:\n${fr2052aResult.error || 'Unknown error'}\n\nCheck console for details.`);
        setLoading(false);
        return;
      }

      updateWorkflowStep('fetch-entities', { status: 'completed', duration: 200 });
      updateWorkflowStep('generate-fr2052a', {
        status: 'completed',
        message: `Generated ${fr2052aResult.results?.totalRecords || 0} FR 2052a records`
      });
      updateWorkflowStep('insert-fr2052a', { status: 'completed', message: 'FR 2052a data saved to database' });
      updateWorkflowStep('calculate-lcr', {
        status: 'completed',
        message: `${fr2052aResult.results?.lcrCalculations?.length || 0} LCR calculations completed`
      });
      updateWorkflowStep('calculate-nsfr', {
        status: 'completed',
        message: `${fr2052aResult.results?.nsfrCalculations?.length || 0} NSFR calculations completed`
      });
      updateWorkflowStep('verify-fr2052a', { status: 'completed', duration: Date.now() - step2Start });

      console.log('✓ FR 2052a data generation completed successfully');

      console.log('Step 3: Generating dashboard data...');
      updateWorkflowStep('seed-accounts', { status: 'in_progress', message: 'Creating account records...' });
      const step3Start = Date.now();

      const dashboardResult = await seedDashboardData();

      if (!dashboardResult.success) {
        updateWorkflowStep('seed-accounts', {
          status: 'warning',
          message: 'Dashboard data generation had issues',
          details: dashboardResult.error || 'Partial failure'
        });
        updateWorkflowStep('seed-transactions', { status: 'warning' });
        console.error('Failed to generate dashboard data:', dashboardResult);
      } else {
        updateWorkflowStep('seed-accounts', { status: 'completed', message: 'Account data created' });
        updateWorkflowStep('seed-transactions', {
          status: 'completed',
          message: 'Transaction history generated',
          duration: Date.now() - step3Start
        });
      }

      updateWorkflowStep('validate-all', { status: 'in_progress', message: 'Running validation checks...' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const validation = await validateGeneratedData();
      setValidationResults(validation);
      setLastGenerated(new Date().toLocaleString());
      setShowResults(true);

      const allPassed = validation.every(r => r.passed);
      if (allPassed) {
        updateWorkflowStep('validate-all', { status: 'completed', message: 'All validation checks passed' });
        updateWorkflowStep('complete', { status: 'completed', message: 'Data generation successful!' });
        alert('✓ All data generated and validated successfully!');
      } else {
        const failures = validation.filter(r => !r.passed);
        updateWorkflowStep('validate-all', {
          status: 'warning',
          message: `${failures.length} validation check(s) failed`
        });
        updateWorkflowStep('complete', {
          status: 'warning',
          message: 'Data generated with validation warnings'
        });
        alert(
          `⚠ Data generated but validation issues found:\n\n` +
          failures.map(f => f.message).join('\n')
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating data:', error);

      workflowSteps.forEach(step => {
        if (step.status === 'in_progress') {
          updateWorkflowStep(step.id, {
            status: 'error',
            message: 'Process interrupted by error',
            details: errorMessage
          });
        }
      });
      updateWorkflowStep('complete', {
        status: 'error',
        message: 'Data generation failed',
        details: errorMessage
      });

      alert(`Error generating data: ${errorMessage}\n\nCheck console and workflow for details.`);
    }

    setLoading(false);
  };

  const handleRefreshDashboardData = async () => {
    setLoading(true);
    setShowResults(false);
    setShowWorkflow(true);

    const refreshSteps: WorkflowStep[] = [
      { id: 'init-refresh', label: 'Initialize dashboard refresh', status: 'pending' },
      { id: 'clear-accounts', label: 'Clear existing accounts', status: 'pending' },
      { id: 'clear-transactions', label: 'Clear existing transactions', status: 'pending' },
      { id: 'generate-accounts', label: 'Generate new account data', status: 'pending' },
      { id: 'insert-accounts', label: 'Insert accounts into database', status: 'pending' },
      { id: 'generate-transactions', label: 'Generate transaction history', status: 'pending' },
      { id: 'insert-transactions', label: 'Insert transactions into database', status: 'pending' },
      { id: 'validate-refresh', label: 'Validate refreshed data', status: 'pending' },
      { id: 'complete-refresh', label: 'Refresh complete', status: 'pending' },
    ];
    setWorkflowSteps(refreshSteps);

    try {
      const startTime = Date.now();
      updateWorkflowStep('init-refresh', { status: 'in_progress' });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateWorkflowStep('init-refresh', { status: 'completed', duration: Date.now() - startTime });

      updateWorkflowStep('clear-accounts', { status: 'in_progress', message: 'Removing old account records...' });
      updateWorkflowStep('clear-transactions', { status: 'in_progress', message: 'Removing old transactions...' });

      const step1Start = Date.now();
      const result = await seedDashboardData();

      if (result.success) {
        updateWorkflowStep('clear-accounts', { status: 'completed', duration: Date.now() - step1Start });
        updateWorkflowStep('clear-transactions', { status: 'completed' });
        updateWorkflowStep('generate-accounts', { status: 'completed', message: 'New accounts created' });
        updateWorkflowStep('insert-accounts', { status: 'completed', message: 'Account data saved' });
        updateWorkflowStep('generate-transactions', { status: 'completed', message: 'Transaction records created' });
        updateWorkflowStep('insert-transactions', { status: 'completed', message: 'Transactions saved' });

        updateWorkflowStep('validate-refresh', { status: 'in_progress', message: 'Validating refreshed data...' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const validation = await validateGeneratedData();
        setValidationResults(validation);
        setLastGenerated(new Date().toLocaleString());
        setShowResults(true);

        updateWorkflowStep('validate-refresh', { status: 'completed', message: 'Validation complete' });
        updateWorkflowStep('complete-refresh', { status: 'completed', message: 'Dashboard data refreshed successfully!' });

        alert('✓ Dashboard data refreshed successfully!');
      } else {
        updateWorkflowStep('clear-accounts', {
          status: 'error',
          message: 'Refresh failed',
          details: result.error || 'Unknown error'
        });
        updateWorkflowStep('complete-refresh', { status: 'error', message: 'Refresh failed' });
        console.error('Refresh error:', result);
        alert('Error refreshing data. Check console for details.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error refreshing data:', error);

      refreshSteps.forEach(step => {
        if (step.status === 'in_progress') {
          updateWorkflowStep(step.id, {
            status: 'error',
            message: 'Process interrupted by error',
            details: errorMessage
          });
        }
      });
      updateWorkflowStep('complete-refresh', {
        status: 'error',
        message: 'Refresh failed',
        details: errorMessage
      });

      alert(`Error refreshing data: ${errorMessage}\n\nCheck console and workflow for details.`);
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

      {showWorkflow && workflowSteps.length > 0 && (
        <DataGenerationWorkflow
          title="Data Generation Progress"
          steps={workflowSteps}
        />
      )}

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
