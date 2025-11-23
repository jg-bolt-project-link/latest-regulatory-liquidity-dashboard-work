import { useState, useEffect } from 'react';
import { TrendingDown, Plus, Play, AlertTriangle, CheckCircle, BarChart3, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Scenario {
  id: string;
  scenario_name: string;
  scenario_type: string;
  reporting_period: string;
  description: string;
  status: string;
  unemployment_rate: number;
  gdp_growth_rate: number;
  market_shock_severity: number;
}

interface StressTestResult {
  id: string;
  scenario_id: string;
  test_date: string;
  pre_stress_cet1_ratio: number;
  post_stress_cet1_ratio: number;
  pre_stress_tier1_ratio: number;
  post_stress_tier1_ratio: number;
  stressed_losses: number;
  stressed_revenues: number;
  minimum_ratio_reached: number;
  quarter_of_minimum: number;
  passes_stress_test: boolean;
  regulatory_minimum_met: boolean;
}

export function StressTestingDashboard() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [results, setResults] = useState<StressTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const [newScenario, setNewScenario] = useState({
    scenario_name: '',
    scenario_type: 'baseline' as const,
    reporting_period: new Date().getFullYear().toString(),
    description: '',
    unemployment_rate: 4.5,
    gdp_growth_rate: 2.0,
    market_shock_severity: 0
  });

  const [newResult, setNewResult] = useState({
    test_date: new Date().toISOString().split('T')[0],
    pre_stress_cet1_ratio: 12.0,
    post_stress_cet1_ratio: 9.5,
    pre_stress_tier1_ratio: 14.0,
    post_stress_tier1_ratio: 11.5,
    stressed_losses: 5000000000,
    stressed_revenues: 2000000000
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [scenariosResult, resultsResult] = await Promise.all([
      supabase.from('stress_test_scenarios').select('*').order('created_at', { ascending: false }),
      supabase.from('stress_test_results').select('*').order('test_date', { ascending: false })
    ]);

    if (scenariosResult.data) setScenarios(scenariosResult.data);
    if (resultsResult.data) setResults(resultsResult.data);
    setLoading(false);
  };

  const handleCreateScenario = async () => {
    const { error } = await supabase.from('stress_test_scenarios').insert([{
      ...newScenario,
      status: 'active'
    }]);

    if (!error) {
      setShowNewScenario(false);
      setNewScenario({
        scenario_name: '',
        scenario_type: 'baseline',
        reporting_period: new Date().getFullYear().toString(),
        description: '',
        unemployment_rate: 4.5,
        gdp_growth_rate: 2.0,
        market_shock_severity: 0
      });
      await loadData();
    }
  };

  const handleRunStressTest = async (scenarioId: string) => {
    const minRatio = newResult.post_stress_cet1_ratio;
    const passesTest = minRatio >= 4.5; // CET1 minimum
    const regulatoryMet = newResult.post_stress_tier1_ratio >= 6.0;

    const { error } = await supabase.from('stress_test_results').insert([{
      scenario_id: scenarioId,
      ...newResult,
      minimum_ratio_reached: minRatio,
      quarter_of_minimum: 4, // Assuming worst case in Q4
      passes_stress_test: passesTest,
      regulatory_minimum_met: regulatoryMet,
      pre_stress_total_capital_ratio: newResult.pre_stress_tier1_ratio + 2.0,
      post_stress_total_capital_ratio: newResult.post_stress_tier1_ratio + 2.0,
      stressed_provisions: newResult.stressed_losses * 0.3
    }]);

    if (!error) {
      await loadData();
      setSelectedScenario(null);
    }
  };

  const formatPercent = (value: number) => `${(value || 0).toFixed(2)}%`;
  const formatCurrency = (value: number) => {
    const billions = value / 1000000000;
    return `$${billions.toFixed(2)}B`;
  };

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'baseline': return 'bg-blue-100 text-blue-800';
      case 'adverse': return 'bg-yellow-100 text-yellow-800';
      case 'severely_adverse': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const scenarioResults = results.filter(r => r.scenario_id === selectedScenario);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading stress testing data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-7 h-7 text-red-600" />
            Capital Stress Testing (CCAR/DFAST)
          </h2>
          <p className="text-slate-600 mt-1">
            Scenario-based stress testing to assess capital adequacy under adverse conditions
          </p>
        </div>
        <button
          onClick={() => setShowNewScenario(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Scenario
        </button>
      </div>

      {/* Regulatory Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Regulation YY § 252.12-252.15</h3>
            <p className="text-sm text-blue-800">
              Covered companies must conduct annual capital stress tests under baseline, adverse, and severely adverse
              scenarios as provided by the Federal Reserve. Post-stress capital ratios must remain above regulatory minimums:
              CET1 ≥ 4.5%, Tier 1 ≥ 6.0%, Total Capital ≥ 8.0%.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Total Scenarios</p>
            <p className="text-2xl font-bold text-slate-900">{scenarios.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Tests Run</p>
            <p className="text-2xl font-bold text-slate-900">{results.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Tests Passed</p>
            <p className="text-2xl font-bold text-green-600">
              {results.filter(r => r.passes_stress_test).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Tests Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {results.filter(r => !r.passes_stress_test).length}
            </p>
          </div>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map(scenario => {
          const scenarioResults = results.filter(r => r.scenario_id === scenario.id);
          const latestResult = scenarioResults[0];

          return (
            <div key={scenario.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{scenario.scenario_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getScenarioColor(scenario.scenario_type)}`}>
                      {scenario.scenario_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{scenario.reporting_period}</p>
                </div>
                <button
                  onClick={() => setSelectedScenario(scenario.id)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Run Stress Test"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>

              {scenario.description && (
                <p className="text-sm text-slate-700 mb-4">{scenario.description}</p>
              )}

              {/* Scenario Parameters */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600 mb-1">Unemployment</p>
                  <p className="font-semibold text-slate-900">{formatPercent(scenario.unemployment_rate)}</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600 mb-1">GDP Growth</p>
                  <p className="font-semibold text-slate-900">{formatPercent(scenario.gdp_growth_rate)}</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600 mb-1">Market Shock</p>
                  <p className="font-semibold text-slate-900">{formatPercent(scenario.market_shock_severity)}</p>
                </div>
              </div>

              {/* Latest Results */}
              {latestResult && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-700">Latest Test Results</p>
                    {latestResult.passes_stress_test ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-600">Pre-Stress CET1</p>
                      <p className="font-semibold text-slate-900">
                        {formatPercent(latestResult.pre_stress_cet1_ratio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Post-Stress CET1</p>
                      <p className={`font-semibold ${latestResult.post_stress_cet1_ratio >= 4.5 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(latestResult.post_stress_cet1_ratio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Stressed Losses</p>
                      <p className="font-semibold text-red-600">
                        {formatCurrency(latestResult.stressed_losses)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Min Ratio (Q{latestResult.quarter_of_minimum})</p>
                      <p className="font-semibold text-slate-900">
                        {formatPercent(latestResult.minimum_ratio_reached)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {scenarioResults.length === 0 && (
                <div className="text-center text-slate-500 py-4 text-sm">
                  No test results yet. Click play to run stress test.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No stress test scenarios defined</p>
          <button
            onClick={() => setShowNewScenario(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Scenario
          </button>
        </div>
      )}

      {/* New Scenario Modal */}
      {showNewScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Create Stress Test Scenario</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Scenario Name</label>
                <input
                  type="text"
                  value={newScenario.scenario_name}
                  onChange={(e) => setNewScenario({ ...newScenario, scenario_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2024 Severely Adverse"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Scenario Type</label>
                  <select
                    value={newScenario.scenario_type}
                    onChange={(e) => setNewScenario({ ...newScenario, scenario_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="baseline">Baseline</option>
                    <option value="adverse">Adverse</option>
                    <option value="severely_adverse">Severely Adverse</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reporting Period</label>
                  <input
                    type="text"
                    value={newScenario.reporting_period}
                    onChange={(e) => setNewScenario({ ...newScenario, reporting_period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unemployment Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newScenario.unemployment_rate}
                    onChange={(e) => setNewScenario({ ...newScenario, unemployment_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GDP Growth (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newScenario.gdp_growth_rate}
                    onChange={(e) => setNewScenario({ ...newScenario, gdp_growth_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Market Shock (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newScenario.market_shock_severity}
                    onChange={(e) => setNewScenario({ ...newScenario, market_shock_severity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewScenario(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateScenario}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Test Modal */}
      {selectedScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Run Stress Test</h3>
              <p className="text-sm text-slate-600 mt-1">
                {scenarios.find(s => s.id === selectedScenario)?.scenario_name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pre-Stress CET1 Ratio (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newResult.pre_stress_cet1_ratio}
                    onChange={(e) => setNewResult({ ...newResult, pre_stress_cet1_ratio: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Post-Stress CET1 Ratio (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newResult.post_stress_cet1_ratio}
                    onChange={(e) => setNewResult({ ...newResult, post_stress_cet1_ratio: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pre-Stress Tier 1 Ratio (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newResult.pre_stress_tier1_ratio}
                    onChange={(e) => setNewResult({ ...newResult, pre_stress_tier1_ratio: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Post-Stress Tier 1 Ratio (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newResult.post_stress_tier1_ratio}
                    onChange={(e) => setNewResult({ ...newResult, post_stress_tier1_ratio: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stressed Losses ($)</label>
                  <input
                    type="number"
                    value={newResult.stressed_losses}
                    onChange={(e) => setNewResult({ ...newResult, stressed_losses: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stressed Revenues ($)</label>
                  <input
                    type="number"
                    value={newResult.stressed_revenues}
                    onChange={(e) => setNewResult({ ...newResult, stressed_revenues: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedScenario(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRunStressTest(selectedScenario)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Run Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
