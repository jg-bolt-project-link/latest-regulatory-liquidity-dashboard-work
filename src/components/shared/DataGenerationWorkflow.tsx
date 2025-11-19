import { CheckCircle, Circle, Loader, XCircle, AlertTriangle } from 'lucide-react';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'warning';
  message?: string;
  duration?: number;
  details?: string;
}

interface DataGenerationWorkflowProps {
  steps: WorkflowStep[];
  title: string;
}

export function DataGenerationWorkflow({ steps, title }: DataGenerationWorkflowProps) {
  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'in_progress':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-600 bg-green-50';
      case 'in_progress':
        return 'border-blue-600 bg-blue-50';
      case 'error':
        return 'border-red-600 bg-red-50';
      case 'warning':
        return 'border-amber-600 bg-amber-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getConnectorColor = (currentStatus: WorkflowStep['status'], nextStatus?: WorkflowStep['status']) => {
    if (currentStatus === 'completed') {
      return 'bg-green-600';
    }
    if (currentStatus === 'in_progress') {
      return 'bg-blue-600';
    }
    if (currentStatus === 'error') {
      return 'bg-red-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div className="space-y-1">
        {steps.map((step, index) => (
          <div key={step.id}>
            <div
              className={`relative flex items-start gap-4 p-4 border-2 rounded-lg transition-all ${getStatusColor(
                step.status
              )}`}
            >
              <div className="flex-shrink-0 mt-0.5">{getStatusIcon(step.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Step {index + 1}: {step.label}
                    </p>
                    {step.message && (
                      <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                    )}
                    {step.details && (
                      <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 p-2 rounded">
                        {step.details}
                      </p>
                    )}
                  </div>
                  {step.duration !== undefined && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {step.duration}ms
                    </span>
                  )}
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex justify-start ml-[29px]">
                <div
                  className={`w-0.5 h-3 transition-colors ${getConnectorColor(
                    step.status,
                    steps[index + 1]?.status
                  )}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-gray-300" />
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader className="w-4 h-4 text-blue-600" />
          <span className="text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-gray-600">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-gray-600">Error</span>
        </div>
      </div>
    </div>
  );
}
