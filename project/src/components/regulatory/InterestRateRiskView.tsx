import { ArrowLeft } from 'lucide-react';

interface InterestRateRiskViewProps {
  onBack: () => void;
}

export function InterestRateRiskView({ onBack }: InterestRateRiskViewProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </button>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Interest Rate Risk</h2>
        <p className="text-sm text-slate-600 mt-1">NII & EVE Sensitivity per OCC Guidelines</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Interest rate risk analysis coming soon</p>
      </div>
    </div>
  );
}
