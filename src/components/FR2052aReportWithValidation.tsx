import { useState } from 'react';
import { FileText, CheckSquare } from 'lucide-react';
import { FR2052aDashboard } from './FR2052aDashboard';
import { FR2052aValidation } from './FR2052aValidation';

export function FR2052aReportWithValidation() {
  const [activeTab, setActiveTab] = useState<'report' | 'validation'>('report');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'report'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              FR2052a Report
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'validation'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              Validation Checks
            </button>
          </div>
        </div>

        {/* Tab Description */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          {activeTab === 'report' && (
            <p className="text-sm text-slate-600">
              View FR2052a regulatory report data including HQLA, Cash Flows, Maturity Mismatch Analysis, and detailed line-by-line breakdowns
            </p>
          )}
          {activeTab === 'validation' && (
            <p className="text-sm text-slate-600">
              Run comprehensive validation checks on FR2052a data including mathematical validations, cross-checks, and regulatory compliance rules
            </p>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'report' && <FR2052aDashboard onClose={() => {}} />}
        {activeTab === 'validation' && <FR2052aValidation />}
      </div>
    </div>
  );
}
