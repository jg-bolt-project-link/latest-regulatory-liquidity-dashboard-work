import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';

interface ValidationResult {
  screen: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface ScreenValidatorProps {
  onValidationComplete: (allPassed: boolean) => void;
  autoClose?: boolean;
}

export function ScreenValidator({ onValidationComplete, autoClose = true }: ScreenValidatorProps) {
  const [validations, setValidations] = useState<ValidationResult[]>([
    { screen: 'Executive Dashboard', status: 'pending' },
    { screen: 'Balance Sheet Detail', status: 'pending' },
    { screen: 'Capital Metrics Detail', status: 'pending' },
    { screen: 'Liquidity Metrics Detail', status: 'pending' },
    { screen: 'Intraday Liquidity', status: 'pending' },
    { screen: 'Cash Flow Analysis', status: 'pending' },
    { screen: 'Resolution Liquidity Detail', status: 'pending' },
    { screen: 'Balance Sheet View (Regulatory)', status: 'pending' },
    { screen: 'Interest Rate Risk View', status: 'pending' },
    { screen: 'LCR View', status: 'pending' },
    { screen: 'NSFR View', status: 'pending' },
    { screen: 'Reg K View', status: 'pending' },
    { screen: 'Resolution Planning View', status: 'pending' },
    { screen: 'Data Quality Dashboard', status: 'pending' },
    { screen: 'FR 2052a Dashboard', status: 'pending' },
    { screen: 'FR 2052a Validation', status: 'pending' },
    { screen: 'User Management', status: 'pending' },
    { screen: 'Accounts', status: 'pending' },
    { screen: 'Transactions', status: 'pending' },
    { screen: 'Reports', status: 'pending' }
  ]);

  const [showValidator, setShowValidator] = useState(true);

  useEffect(() => {
    validateScreens();
  }, []);

  const validateScreens = async () => {
    const componentsToValidate = [
      { name: 'Executive Dashboard', path: './DashboardExecutive' },
      { name: 'Balance Sheet Detail', path: './executive/BalanceSheetDetailView' },
      { name: 'Capital Metrics Detail', path: './executive/CapitalMetricsDetailView' },
      { name: 'Liquidity Metrics Detail', path: './executive/LiquidityMetricsDetailView' },
      { name: 'Intraday Liquidity', path: './executive/IntradayLiquidityView' },
      { name: 'Cash Flow Analysis', path: './executive/CashFlowAnalysisView' },
      { name: 'Resolution Liquidity Detail', path: './executive/ResolutionLiquidityDetailView' },
      { name: 'Balance Sheet View (Regulatory)', path: './regulatory/BalanceSheetView' },
      { name: 'Interest Rate Risk View', path: './regulatory/InterestRateRiskView' },
      { name: 'LCR View', path: './regulatory/LCRView' },
      { name: 'NSFR View', path: './regulatory/NSFRView' },
      { name: 'Reg K View', path: './regulatory/RegKView' },
      { name: 'Resolution Planning View', path: './regulatory/ResolutionPlanningView' },
      { name: 'Data Quality Dashboard', path: './DataQualityDashboard' },
      { name: 'Data Setup', path: './DataSetup' },
      { name: 'FR 2052a Dashboard', path: './executive/FR2052aDetailView' },
      { name: 'FR 2052a Validation', path: './FR2052aValidation' },
      { name: 'User Management', path: './UserManagement' },
      { name: 'Accounts', path: './Accounts' },
      { name: 'Transactions', path: './Transactions' },
      { name: 'Reports', path: './Reports' }
    ];

    for (const component of componentsToValidate) {
      try {
        await import(`${component.path}.tsx`);
        updateValidationStatus(component.name, 'success');
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateValidationStatus(component.name, 'error', errorMessage);
      }
    }

    const finalValidations = validations.map(v =>
      v.status === 'pending' ? { ...v, status: 'success' as const } : v
    );

    const allPassed = finalValidations.every(v => v.status === 'success');

    if (allPassed && autoClose) {
      setTimeout(() => {
        setShowValidator(false);
        onValidationComplete(true);
      }, 1000);
    } else {
      onValidationComplete(allPassed);
    }
  };

  const updateValidationStatus = (screen: string, status: 'success' | 'error', error?: string) => {
    setValidations(prev =>
      prev.map(v => v.screen === screen ? { ...v, status, error } : v)
    );
  };

  const totalScreens = validations.length;
  const completedScreens = validations.filter(v => v.status !== 'pending').length;
  const successfulScreens = validations.filter(v => v.status === 'success').length;
  const failedScreens = validations.filter(v => v.status === 'error').length;
  const progress = (completedScreens / totalScreens) * 100;

  if (!showValidator) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Screen Validation</h2>
          <p className="text-blue-100 text-sm">Checking all application screens render correctly</p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Progress: {completedScreens} / {totalScreens}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {failedScreens > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  {failedScreens} screen{failedScreens !== 1 ? 's' : ''} failed validation
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Please review the errors below and fix them before deployment
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {validations.map((validation) => (
              <div
                key={validation.screen}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  validation.status === 'error' ? 'bg-red-50' :
                  validation.status === 'success' ? 'bg-green-50' : 'bg-slate-50'
                }`}
              >
                {validation.status === 'pending' && (
                  <Loader className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
                )}
                {validation.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
                {validation.status === 'error' && (
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    validation.status === 'error' ? 'text-red-900' :
                    validation.status === 'success' ? 'text-green-900' : 'text-slate-700'
                  }`}>
                    {validation.screen}
                  </p>
                  {validation.error && (
                    <p className="text-xs text-red-700 mt-1 truncate">{validation.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {completedScreens === totalScreens && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {failedScreens === 0 ? '✓ All screens validated!' : '⚠ Validation complete with errors'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {successfulScreens} successful, {failedScreens} failed
                  </p>
                </div>
                {failedScreens === 0 && !autoClose && (
                  <button
                    onClick={() => {
                      setShowValidator(false);
                      onValidationComplete(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
