import { useState, useEffect } from 'react';
import { DashboardExecutive } from './DashboardExecutive';
import { Accounts } from './Accounts';
import { Transactions } from './Transactions';
import { Reports } from './Reports';
import { UserManagement } from './UserManagement';
import { BalanceSheetDetailView } from './executive/BalanceSheetDetailView';
import { LiquidityMetricsDetailView } from './executive/LiquidityMetricsDetailView';
import { CapitalMetricsDetailView } from './executive/CapitalMetricsDetailView';
import { CashFlowAnalysisView } from './executive/CashFlowAnalysisView';
import { IntradayLiquidityView } from './executive/IntradayLiquidityView';
import { DataQualityDashboardNew } from './DataQualityDashboardNew';
import { FR2052aDetailView } from './executive/FR2052aDetailView';
import { FR2052aValidation } from './FR2052aValidation';
import { DataSetup } from './DataSetup';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { seedStateStreetData } from '../utils/seedStateStreetData';
import { seedFR2052aWithCalculations } from '../utils/seedFR2052aWithCalculations';
import { ChatAssistant } from './shared/ChatAssistant';
import { ScreenValidator } from './shared/ScreenValidator';
import { AuthForm } from './AuthForm';
import {
  LayoutDashboard,
  FileText,
  Shield,
  Wallet,
  Receipt,
  Users,
  TrendingUp,
  Droplets,
  Activity,
  Clock,
  BarChart3,
  CheckCircle,
  Database,
  Menu,
  X,
  FileCheck,
  Settings
} from 'lucide-react';

type ViewType =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'reports'
  | 'users'
  | 'balance-sheet'
  | 'capital-metrics'
  | 'liquidity-metrics'
  | 'cash-flow'
  | 'intraday-liquidity'
  | 'data-quality'
  | 'data-setup'
  | 'fr2052a'
  | 'fr2052a-validation';

export function MainApp() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showValidator, setShowValidator] = useState(true);
  const [validationPassed, setValidationPassed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      if (!user || hasInitialized || isInitializing) return;

      const { count } = await supabase
        .from('fr2052a_data_rows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!count || count === 0) {
        console.log('No FR 2052a data found. Auto-generating sample data...');
        setIsInitializing(true);

        try {
          console.log('Step 1: Creating legal entities...');
          await seedStateStreetData(user.id);

          console.log('Step 2: Generating FR 2052a data and calculations...');
          await seedFR2052aWithCalculations(user.id);

          console.log('FR 2052a data generation complete!');
          setHasInitialized(true);
        } catch (error) {
          console.error('Error during auto-initialization:', error);
        } finally {
          setIsInitializing(false);
        }
      } else {
        setHasInitialized(true);
      }
    };

    initializeData();
  }, [user, hasInitialized, isInitializing]);

  const handleValidationComplete = (allPassed: boolean) => {
    setValidationPassed(allPassed);
    setShowValidator(false);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'data-setup', label: 'Data Setup', icon: Settings },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: TrendingUp },
    { id: 'capital-metrics', label: 'Capital Metrics', icon: Shield },
    { id: 'liquidity-metrics', label: 'Liquidity Metrics', icon: Droplets },
    { id: 'cash-flow', label: 'Cash Flow Analysis', icon: Activity },
    { id: 'intraday-liquidity', label: 'Intraday Liquidity', icon: Clock },
    { id: 'data-quality', label: 'Data Quality', icon: CheckCircle },
    { id: 'fr2052a', label: 'FR 2052a Report', icon: Database },
    { id: 'fr2052a-validation', label: 'FR 2052a Validation', icon: FileCheck },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
  ] as const;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardExecutive onNavigate={setActiveView} />;
      case 'balance-sheet':
        return <BalanceSheetDetailView onNavigate={setActiveView} />;
      case 'capital-metrics':
        return <CapitalMetricsDetailView onNavigate={setActiveView} />;
      case 'liquidity-metrics':
        return <LiquidityMetricsDetailView onNavigate={setActiveView} />;
      case 'cash-flow':
        return <CashFlowAnalysisView onNavigate={setActiveView} />;
      case 'intraday-liquidity':
        return <IntradayLiquidityView onNavigate={setActiveView} />;
      case 'data-quality':
        return <DataQualityDashboardNew onClose={() => setActiveView('dashboard')} />;
      case 'data-setup':
        return <DataSetup />;
      case 'fr2052a':
        return <FR2052aDetailView onNavigate={setActiveView} />;
      case 'fr2052a-validation':
        return <FR2052aValidation />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UserManagement />;
      default:
        return <DashboardExecutive onNavigate={setActiveView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <>
      {showValidator && <ScreenValidator onValidationComplete={handleValidationComplete} autoClose={true} />}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h2 className="font-bold text-slate-900">Liquidity Hub</h2>
              <p className="text-xs text-slate-500">State Street Corp</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`${sidebarOpen ? 'w-5 h-5' : 'w-6 h-6 mx-auto'} flex-shrink-0`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </main>

      <ChatAssistant />
    </div>
    </>
  );
}
