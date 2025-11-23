import { useState, useEffect, useMemo } from 'react';
import { X, BarChart3, LineChart, PieChart, TrendingUp, Filter, Download, Plus, Minus, Calendar } from 'lucide-react';

interface DataPoint {
  [key: string]: any;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'trend';
  groupBy: string[];
  aggregateField: string;
  aggregateFunction: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dateField?: string;
  dateGrouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

interface DataVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DataPoint[];
  availableAttributes: {
    name: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean';
  }[];
  defaultAggregateField?: string;
}

export function DataVisualization({
  isOpen,
  onClose,
  title,
  data,
  availableAttributes,
  defaultAggregateField
}: DataVisualizationProps) {
  const dateField = availableAttributes.find(a => a.type === 'date')?.name;
  const hasDateField = !!dateField;

  const [config, setConfig] = useState<ChartConfig>({
    type: hasDateField ? 'trend' : 'bar',
    groupBy: hasDateField ? [dateField] : [],
    aggregateField: defaultAggregateField || availableAttributes.find(a => a.type === 'number')?.name || '',
    aggregateFunction: 'avg',
    dateField: dateField,
    dateGrouping: 'month'
  });

  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [showAttributePanel, setShowAttributePanel] = useState(true);

  const numericAttributes = useMemo(() =>
    availableAttributes.filter(a => a.type === 'number'),
    [availableAttributes]
  );

  const categoricalAttributes = useMemo(() =>
    availableAttributes.filter(a => a.type === 'string' || a.type === 'boolean'),
    [availableAttributes]
  );

  const dateAttributes = useMemo(() =>
    availableAttributes.filter(a => a.type === 'date'),
    [availableAttributes]
  );

  // Helper functions must be defined before useMemo
  const aggregateValues = (values: any[], func: ChartConfig['aggregateFunction']) => {
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (numericValues.length === 0) return 0;

    switch (func) {
      case 'sum':
        return numericValues.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      case 'count':
        return numericValues.length;
      case 'min':
        return Math.min(...numericValues);
      case 'max':
        return Math.max(...numericValues);
      default:
        return 0;
    }
  };

  const groupData = (data: DataPoint[], groupBy: string[]) => {
    return data.reduce((acc, item) => {
      const key = groupBy.map(attr => item[attr] || 'N/A').join(' | ');
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, DataPoint[]>);
  };

  const aggregateByDate = (data: DataPoint[], config: ChartConfig) => {
    if (!config.dateField) return [];

    const grouped = data.reduce((acc, item) => {
      const dateValue = item[config.dateField!];
      if (!dateValue) return acc;

      const date = new Date(dateValue);
      let key: string;

      switch (config.dateGrouping) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, DataPoint[]>);

    return Object.entries(grouped)
      .map(([key, items]) => ({
        category: key,
        value: aggregateValues(items.map(d => d[config.aggregateField]), config.aggregateFunction),
        count: items.length
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  };

  const aggregatedData = useMemo(() => {
    if (!config.aggregateField || data.length === 0) return [];

    if (config.type === 'trend' && config.dateField) {
      return aggregateByDate(data, config);
    }

    if (config.groupBy.length === 0) {
      const total = aggregateValues(data.map(d => d[config.aggregateField]), config.aggregateFunction);
      return [{ category: 'Total', value: total }];
    }

    const grouped = groupData(data, config.groupBy);
    return Object.entries(grouped).map(([key, items]) => ({
      category: key,
      value: aggregateValues(items.map(d => d[config.aggregateField]), config.aggregateFunction),
      count: items.length
    })).sort((a, b) => b.value - a.value);
  }, [data, config]);

  const toggleAttribute = (attrName: string) => {
    setSelectedAttributes(prev =>
      prev.includes(attrName)
        ? prev.filter(a => a !== attrName)
        : [...prev, attrName]
    );
  };

  const addToGroupBy = (attrName: string) => {
    if (!config.groupBy.includes(attrName)) {
      setConfig(prev => ({
        ...prev,
        groupBy: [...prev.groupBy, attrName]
      }));
    }
  };

  const removeFromGroupBy = (attrName: string) => {
    setConfig(prev => ({
      ...prev,
      groupBy: prev.groupBy.filter(a => a !== attrName)
    }));
  };

  const exportData = () => {
    const csvRows = [
      ['Category', 'Value', 'Count'],
      ...aggregatedData.map(d => [d.category, d.value, d.count || ''])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_visualization_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const maxValue = Math.max(...aggregatedData.map(d => d.value));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-purple-100">Data Visualization & Analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-100 p-1 rounded-full hover:bg-purple-800 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Chart Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chart Type</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, type: 'bar' }))}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border ${
                    config.type === 'bar'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, type: 'line' }))}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border ${
                    config.type === 'line'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <LineChart className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, type: 'trend' }))}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border ${
                    config.type === 'trend'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Aggregate Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Measure</label>
              <select
                value={config.aggregateField}
                onChange={(e) => setConfig(prev => ({ ...prev, aggregateField: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {numericAttributes.map(attr => (
                  <option key={attr.name} value={attr.name}>{attr.label}</option>
                ))}
              </select>
            </div>

            {/* Aggregate Function */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Function</label>
              <select
                value={config.aggregateFunction}
                onChange={(e) => setConfig(prev => ({ ...prev, aggregateFunction: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>

            {/* Date Grouping (for trend) */}
            {config.type === 'trend' && dateAttributes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Period</label>
                <select
                  value={config.dateGrouping}
                  onChange={(e) => setConfig(prev => ({ ...prev, dateGrouping: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            )}
          </div>

          {/* Group By Attributes */}
          {config.type !== 'trend' && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700 mb-2">Group By Attributes</label>
              <div className="flex flex-wrap gap-2">
                {config.groupBy.map(attr => {
                  const attrDef = availableAttributes.find(a => a.name === attr);
                  return (
                    <button
                      key={attr}
                      onClick={() => removeFromGroupBy(attr)}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 flex items-center gap-1"
                    >
                      {attrDef?.label || attr}
                      <Minus className="h-3 w-3" />
                    </button>
                  );
                })}
                {categoricalAttributes
                  .filter(attr => !config.groupBy.includes(attr.name))
                  .map(attr => (
                    <button
                      key={attr.name}
                      onClick={() => addToGroupBy(attr.name)}
                      className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 flex items-center gap-1"
                    >
                      {attr.label}
                      <Plus className="h-3 w-3" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {aggregatedData.length} {aggregatedData.length === 1 ? 'group' : 'groups'} from {data.length} records
            </div>
            <button
              onClick={exportData}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {aggregatedData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No data to visualize. Adjust your filters or select different attributes.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(aggregatedData.reduce((sum, d) => sum + d.value, 0))}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700 font-medium">Average</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(aggregatedData.reduce((sum, d) => sum + d.value, 0) / aggregatedData.length)}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-xs text-orange-700 font-medium">Maximum</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(Math.max(...aggregatedData.map(d => d.value)))}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs text-purple-700 font-medium">Groups</p>
                  <p className="text-2xl font-bold text-purple-900">{aggregatedData.length}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="space-y-3">
                  {aggregatedData.slice(0, 50).map((item, idx) => {
                    const percentage = (item.value / maxValue) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700 truncate max-w-md" title={item.category}>
                            {item.category}
                          </span>
                          <span className="font-semibold text-slate-900 ml-4">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-8 relative overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              config.type === 'trend'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : idx === 0
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                : idx === 1
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : idx === 2
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : 'bg-gradient-to-r from-slate-400 to-slate-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                              <span className="text-xs font-medium text-white">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {item.count && (
                          <div className="text-xs text-slate-500 ml-1">
                            {item.count} {item.count === 1 ? 'record' : 'records'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {aggregatedData.length > 50 && (
                  <div className="mt-4 text-center text-sm text-slate-500">
                    Showing top 50 of {aggregatedData.length} groups
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
