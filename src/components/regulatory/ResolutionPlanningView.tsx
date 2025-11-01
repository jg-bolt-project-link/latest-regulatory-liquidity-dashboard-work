import { ArrowLeft } from 'lucide-react';

interface ResolutionPlanningViewProps {
  onBack: () => void;
}

export function ResolutionPlanningView({ onBack }: ResolutionPlanningViewProps) {
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
        <h2 className="text-2xl font-bold text-slate-900">Resolution Planning</h2>
        <p className="text-sm text-slate-600 mt-1">Section 165d / Regulation QQ Requirements</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Resolution planning metrics coming soon</p>
      </div>
    </div>
  );
}
