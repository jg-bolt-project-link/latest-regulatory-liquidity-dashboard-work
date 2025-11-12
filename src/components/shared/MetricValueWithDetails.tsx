import { Eye, FileText, Table } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailsModal } from './MetricDetailsModal';
import { RegulatoryReferencesModal } from './RegulatoryReferencesModal';
import { RawDataTableModal } from './RawDataTableModal';

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
  const [showRegulatory, setShowRegulatory] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span className={className}>{value}</span>
        <span className="inline-flex items-center gap-1">
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRegulatory(true);
            }}
            className="flex-shrink-0 p-1 hover:bg-purple-100 rounded transition-colors"
            title="View regulatory references"
          >
            <FileText className="w-4 h-4 text-purple-600 hover:text-purple-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRawData(true);
            }}
            className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors"
            title="View raw data table"
          >
            <Table className="w-4 h-4 text-green-600 hover:text-green-700" />
          </button>
        </span>
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

      {showRegulatory && (
        <RegulatoryReferencesModal
          metricName={metricName}
          onClose={() => setShowRegulatory(false)}
        />
      )}

      {showRawData && (
        <RawDataTableModal
          metricName={metricName}
          targetTable={targetTable}
          targetColumn={targetColumn}
          onClose={() => setShowRawData(false)}
        />
      )}
    </>
  );
}
