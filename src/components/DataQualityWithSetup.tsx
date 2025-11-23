import { useState } from 'react';
import { Database, Settings, CheckCircle } from 'lucide-react';
import { DataQualityDashboardNew } from './DataQualityDashboardNew';
import { DataSetup } from './DataSetup';
import { ApplicationValidations } from './ApplicationValidations';

export function DataQualityWithSetup() {
  const [activeTab, setActiveTab] = useState<'quality' | 'setup' | 'validations'>('quality');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('quality')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'quality'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-5 h-5" />
              Data Quality Dashboard
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'setup'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-5 h-5" />
              Data Setup & Configuration
            </button>
            <button
              onClick={() => setActiveTab('validations')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'validations'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Application Validations
            </button>
          </div>
        </div>

        {/* Tab Description */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          {activeTab === 'quality' && (
            <p className="text-sm text-slate-600">
              Monitor data quality scores, completeness, accuracy, and timeliness across all data sources and regulatory metrics
            </p>
          )}
          {activeTab === 'setup' && (
            <p className="text-sm text-slate-600">
              Configure data sources, generate sample data, seed calculations, and manage legal entity structures
            </p>
          )}
          {activeTab === 'validations' && (
            <p className="text-sm text-slate-600">
              Run comprehensive application-wide validations to ensure data integrity, calculation accuracy, and regulatory compliance
            </p>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'quality' && <DataQualityDashboardNew onClose={() => {}} />}
        {activeTab === 'setup' && <DataSetup />}
        {activeTab === 'validations' && <ApplicationValidations />}
      </div>
    </div>
  );
}
