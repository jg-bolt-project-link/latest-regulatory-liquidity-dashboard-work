import { useState } from 'react';
import { Droplets, CheckSquare } from 'lucide-react';
import { LiquidityMetricsDetailView } from './LiquidityMetricsDetailView';
import { EnhancedLCRValidationScreen } from '../validation/EnhancedLCRValidationScreen';
import { EnhancedNSFRValidationScreen } from '../validation/EnhancedNSFRValidationScreen';

interface LiquidityMetricsWithValidationsProps {
  onNavigate?: (view: string) => void;
}

export function LiquidityMetricsWithValidations({ onNavigate }: LiquidityMetricsWithValidationsProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'lcr-validation' | 'nsfr-validation'>('metrics');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-5 h-5" />
              Liquidity Metrics
            </button>
            <button
              onClick={() => setActiveTab('lcr-validation')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'lcr-validation'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              LCR Validation
            </button>
            <button
              onClick={() => setActiveTab('nsfr-validation')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'nsfr-validation'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              NSFR Validation
            </button>
          </div>
        </div>

        {/* Tab Description */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          {activeTab === 'metrics' && (
            <p className="text-sm text-slate-600">
              View LCR, NSFR, and resolution liquidity metrics with detailed component breakdowns and regulatory requirements
            </p>
          )}
          {activeTab === 'lcr-validation' && (
            <p className="text-sm text-slate-600">
              Run comprehensive LCR validation checks including mathematical validations, component cross-checks, and regulatory compliance rules
            </p>
          )}
          {activeTab === 'nsfr-validation' && (
            <p className="text-sm text-slate-600">
              Run comprehensive NSFR validation checks including mathematical validations, component cross-checks, and regulatory compliance rules
            </p>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'metrics' && <LiquidityMetricsDetailView onNavigate={onNavigate} />}
        {activeTab === 'lcr-validation' && <EnhancedLCRValidationScreen />}
        {activeTab === 'nsfr-validation' && <EnhancedNSFRValidationScreen />}
      </div>
    </div>
  );
}
