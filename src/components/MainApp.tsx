import { useState } from 'react';
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
import { FR2052aDashboard } from './FR2052aDashboard';
import { FR2052aValidation } from './FR2052aValidation';
import { ChatAssistant } from './shared/ChatAssistant';
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
  FileCheck
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
  | 'fr2052a'
  | 'fr2052a-validation';

export function MainApp() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: TrendingUp },
    { id: 'capital-metrics', label: 'Capital Metrics', icon: Shield },
    { id: 'liquidity-metrics', label: 'Liquidity Metrics', icon: Droplets },
    { id: 'cash-flow', label: 'Cash Flow Analysis', icon: Activity },
    { id: 'intraday-liquidity', label: 'Intraday Liquidity', icon: Clock },
    { id: 'data-quality', label: 'Data Quality', icon: CheckCircle },
    { id: 'fr2052a', label: 'FR 2052a', icon: Database },
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
      case 'fr2052a':
        return <FR2052aDashboard onClose={() => setActiveView('dashboard')} />;
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

  return (
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
  );
}
