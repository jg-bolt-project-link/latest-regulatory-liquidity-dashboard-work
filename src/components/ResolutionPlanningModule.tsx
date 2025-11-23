import { useState, useEffect } from 'react';
import { Shield, Plus, Building, Briefcase, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CriticalOperation {
  id: string;
  operation_name: string;
  operation_code: string;
  business_line: string;
  customer_impact_level: string;
  recovery_time_objective_hours: number;
  continuity_plan_status: string;
  status: string;
}

interface CoreBusinessLine {
  id: string;
  business_line_name: string;
  business_line_code: string;
  annual_revenue: number;
  wind_down_complexity: string;
  estimated_wind_down_time_months: number;
  status: string;
}

interface MaterialEntity {
  id: string;
  entity_name: string;
  jurisdiction: string;
  total_assets: number;
  total_liabilities: number;
  resolution_strategy: string;
  status: string;
}

export function ResolutionPlanningModule() {
  const [activeTab, setActiveTab] = useState<'operations' | 'business_lines' | 'entities'>('operations');
  const [criticalOps, setCriticalOps] = useState<CriticalOperation[]>([]);
  const [businessLines, setBusinessLines] = useState<CoreBusinessLine[]>([]);
  const [entities, setEntities] = useState<MaterialEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewItem, setShowNewItem] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [opsResult, blResult, entResult] = await Promise.all([
      supabase.from('critical_operations').select('*').order('operation_name'),
      supabase.from('core_business_lines').select('*').order('business_line_name'),
      supabase.from('material_entities').select('*').order('entity_name')
    ]);

    if (opsResult.data) setCriticalOps(opsResult.data);
    if (blResult.data) setBusinessLines(blResult.data);
    if (entResult.data) setEntities(entResult.data);
    setLoading(false);
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'very_high': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatCurrency = (value: number) => {
    const billions = value / 1000000000;
    return `$${billions.toFixed(2)}B`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading resolution planning data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Resolution Planning (165(d))
          </h2>
          <p className="text-slate-600 mt-1">Critical operations, core business lines, and material entities</p>
        </div>
        <button
          onClick={() => setShowNewItem(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'operations' ? 'Operation' : activeTab === 'business_lines' ? 'Business Line' : 'Entity'}
        </button>
      </div>

      {/* Regulatory Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-1">Regulation WW § 381.1-381.10</h3>
        <p className="text-sm text-blue-800">
          Resolution plans must identify critical operations, core business lines, and material entities necessary for
          rapid and orderly resolution. Plans must describe how critical operations would be maintained in resolution.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'operations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Critical Operations ({criticalOps.length})
        </button>
        <button
          onClick={() => setActiveTab('business_lines')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'business_lines'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Core Business Lines ({businessLines.length})
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'entities'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Material Entities ({entities.length})
        </button>
      </div>

      {/* Critical Operations */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalOps.map(op => (
            <div key={op.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{op.operation_name}</h3>
                  <p className="text-sm text-slate-600">{op.operation_code}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getImpactColor(op.customer_impact_level)}`}>
                  {op.customer_impact_level?.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Business Line:</span>
                  <span className="font-medium text-slate-900">{op.business_line}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">RTO:</span>
                  <span className="font-medium text-slate-900">{op.recovery_time_objective_hours}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Continuity Plan:</span>
                  <span className={`font-medium ${op.continuity_plan_status === 'complete' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {op.continuity_plan_status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {criticalOps.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              No critical operations defined. Click "Add Operation" to get started.
            </div>
          )}
        </div>
      )}

      {/* Core Business Lines */}
      {activeTab === 'business_lines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessLines.map(bl => (
            <div key={bl.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{bl.business_line_name}</h3>
                  <p className="text-sm text-slate-600">{bl.business_line_code}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getComplexityColor(bl.wind_down_complexity)}`}>
                  {bl.wind_down_complexity?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Annual Revenue:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(bl.annual_revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Wind-Down Time:</span>
                  <span className="font-medium text-slate-900">{bl.estimated_wind_down_time_months} months</span>
                </div>
              </div>
            </div>
          ))}
          {businessLines.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              No core business lines defined. Click "Add Business Line" to get started.
            </div>
          )}
        </div>
      )}

      {/* Material Entities */}
      {activeTab === 'entities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entities.map(entity => (
            <div key={entity.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{entity.entity_name}</h3>
                  <p className="text-sm text-slate-600">{entity.jurisdiction}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Assets:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(entity.total_assets)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Liabilities:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(entity.total_liabilities)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Resolution Strategy:</span>
                  <span className="font-medium text-slate-900">{entity.resolution_strategy || 'TBD'}</span>
                </div>
              </div>
            </div>
          ))}
          {entities.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              No material entities defined. Click "Add Entity" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
