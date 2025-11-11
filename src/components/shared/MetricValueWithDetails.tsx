import { Eye } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailsModal } from './MetricDetailsModal';

interface MetricValueWithDetailsProps {
  value: string | number;
  metricName: string;
  targetTable: string;
  targetColumn: string;
  dataSource: string;
  className?: string;
}

export function MetricValueWithDetails({
  value,
  metricName,
  targetTable,
  targetColumn,
  dataSource,
  className = ''
}: MetricValueWithDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <span className="inline-flex items-center gap-1.5 group">
        <span className={className}>{value}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(true);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
          title="View data quality, feeds, and lineage"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
        </button>
      </span>

      {showDetails && (
        <MetricDetailsModal
          metricName={metricName}
          metricValue={value}
          targetTable={targetTable}
          targetColumn={targetColumn}
          dataSource={dataSource}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}
