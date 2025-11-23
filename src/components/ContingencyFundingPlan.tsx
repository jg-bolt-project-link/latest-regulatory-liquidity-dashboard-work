import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, DollarSign, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FundingSource {
  id: string;
  source_name: string;
  source_type: string;
  total_capacity: number;
  available_capacity: number;
  utilized_amount: number;
  activation_time_hours: number;
  status: string;
}

interface StressTrigger {
  id: string;
  trigger_name: string;
  trigger_category: string;
  trigger_type: string;
  description: string;
  status: string;
}

export function ContingencyFundingPlan() {
  const [activeTab, setActiveTab] = useState<'sources' | 'triggers'>('sources');
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [triggers, setTriggers] = useState<StressTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sourcesResult, triggersResult] = await Promise.all([
      supabase.from('contingency_funding_sources').select('*').order('source_name'),
      supabase.from('funding_stress_triggers').select('*').order('trigger_name')
    ]);

    if (sourcesResult.data) setFundingSources(sourcesResult.data);
    if (triggersResult.data) setTriggers(triggersResult.data);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    const billions = value / 1000000000;
    return `$${billions.toFixed(2)}B`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      committed_line: 'bg-blue-100 text-blue-800',
      repo_capacity: 'bg-green-100 text-green-800',
      discount_window: 'bg-purple-100 text-purple-800',
      asset_sales: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  const getTriggerColor = (type: string) => {
    const colors: Record<string, string> = {
      early_warning: 'bg-yellow-100 text-yellow-800',
      moderate: 'bg-orange-100 text-orange-800',
      severe: 'bg-red-100 text-red-800',
      crisis: 'bg-red-200 text-red-900'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  const totalCapacity = fundingSources.reduce((sum, s) => sum + s.total_capacity, 0);
  const availableCapacity = fundingSources.reduce((sum, s) => sum + s.available_capacity, 0);
  const utilizedAmount = fundingSources.reduce((sum, s) => sum + s.utilized_amount, 0);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-600" />
            Contingency Funding Plan
          </h2>
          <p className="text-slate-600 mt-1">Funding sources and stress event triggers per Reg QQ § 39.4</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-1">Regulation QQ § 39.4</h3>
        <p className="text-sm text-blue-800">
          Covered banks must establish and maintain a contingency funding plan setting out strategies for addressing
          liquidity needs during stress events, including identified funding sources and triggers.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Capacity</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalCapacity)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Available</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(availableCapacity)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Utilized</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(utilizedAmount)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'sources'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Funding Sources ({fundingSources.length})
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'triggers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Stress Triggers ({triggers.length})
        </button>
      </div>

      {/* Funding Sources */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fundingSources.map(source => {
            const utilizationPct = (source.utilized_amount / source.total_capacity) * 100;
            return (
              <div key={source.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{source.source_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${getTypeColor(source.source_type)}`}>
                      {source.source_type.replace('_', ' ')}
                    </span>
                  </div>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Capacity:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(source.total_capacity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Available:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(source.available_capacity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Activation Time:</span>
                    <span className="font-semibold text-slate-900">{source.activation_time_hours}h</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Utilization</span>
                      <span>{utilizationPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${utilizationPct > 80 ? 'bg-red-500' : utilizationPct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${utilizationPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {fundingSources.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              No funding sources defined
            </div>
          )}
        </div>
      )}

      {/* Stress Triggers */}
      {activeTab === 'triggers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {triggers.map(trigger => (
            <div key={trigger.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{trigger.trigger_name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${getTriggerColor(trigger.trigger_type)}`}>
                      {trigger.trigger_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
                      {trigger.trigger_category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-slate-700">{trigger.description}</p>
            </div>
          ))}
          {triggers.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              No stress triggers defined
            </div>
          )}
        </div>
      )}
    </div>
  );
}
