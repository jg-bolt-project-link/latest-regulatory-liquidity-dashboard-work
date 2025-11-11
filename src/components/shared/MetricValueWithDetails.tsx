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
      <span className="inline-flex items-center gap-2">
        <span className={className}>{value}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(true);
          }}
          className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
          title="View data quality, feeds, and lineage"
        >
          <Eye className="w-4 h-4 text-blue-600 hover:text-blue-700" />
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
