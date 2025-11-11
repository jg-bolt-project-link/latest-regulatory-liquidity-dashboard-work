import { ReactNode, useState } from 'react';
import { GitBranch, Activity } from 'lucide-react';
import { DataLineageVisualization } from './DataLineageVisualization';
import { DataQualityCheckModal } from './DataQualityCheckModal';

interface MetricCardWithQualityProps {
  children: ReactNode;
  metricName: string;
  targetTable: string;
  targetColumn: string;
  dataSource: string;
  className?: string;
}

export function MetricCardWithQuality({
  children,
  metricName,
  targetTable,
  targetColumn,
  dataSource,
  className = ''
}: MetricCardWithQualityProps) {
  const [showLineage, setShowLineage] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  return (
    <>
      <div className={`relative group ${className}`}>
        {children}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setShowQuality(true)}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-md border border-slate-200 transition-all hover:scale-105"
            title="View Data Quality Checks"
          >
            <Activity className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => setShowLineage(true)}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-md border border-slate-200 transition-all hover:scale-105"
            title="View Data Lineage"
          >
            <GitBranch className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {showLineage && (
        <DataLineageVisualization
          metricName={metricName}
          targetTable={targetTable}
          targetColumn={targetColumn}
          onClose={() => setShowLineage(false)}
        />
      )}

      {showQuality && (
        <DataQualityCheckModal
          metricName={metricName}
          dataSource={dataSource}
          onClose={() => setShowQuality(false)}
        />
      )}
    </>
  );
}
