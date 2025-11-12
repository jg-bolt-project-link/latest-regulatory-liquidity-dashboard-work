import { X, Table as TableIcon, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface RawDataTableModalProps {
  metricName: string;
  targetTable: string;
  targetColumn: string;
  onClose: () => void;
}

export function RawDataTableModal({
  metricName,
  targetTable,
  targetColumn,
  onClose
}: RawDataTableModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [targetTable]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: tableData, error: fetchError } = await supabase
        .from(targetTable)
        .select('*')
        .order('report_date', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      if (tableData && tableData.length > 0) {
        setData(tableData);
        setColumns(Object.keys(tableData[0]));
      } else {
        setData([]);
        setColumns([]);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (value > 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      }
      if (value < 1 && value > 0) {
        return `${(value * 100).toFixed(2)}%`;
      }
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      if (value.length > 50) return value.substring(0, 47) + '...';
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(value).toLocaleDateString();
      }
    }
    return String(value);
  };

  const formatColumnName = (col: string): string => {
    return col
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${targetTable}_${targetColumn}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TableIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Raw Data Table</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {metricName} - {targetTable}.{targetColumn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-600">Loading data...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">No data available in this table.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <strong>Table:</strong> {targetTable} | <strong>Records:</strong> {data.length} (showing most recent 10)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap"
                        >
                          {formatColumnName(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`border-b border-slate-200 hover:bg-slate-50 ${
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className={`px-4 py-3 text-sm text-slate-900 whitespace-nowrap ${
                              col === targetColumn ? 'font-semibold bg-yellow-50' : ''
                            }`}
                            title={String(row[col] || '')}
                          >
                            {formatValue(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <strong>Highlighted Column:</strong> The <span className="font-mono bg-yellow-100 px-1 py-0.5 rounded">{targetColumn}</span> column
                  (highlighted in yellow) contains the data used for calculating the "{metricName}" metric.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
