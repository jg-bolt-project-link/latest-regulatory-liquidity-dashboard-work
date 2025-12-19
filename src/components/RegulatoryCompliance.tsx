import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronRight, FileText, Filter, Search, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { seedRegulatoryRules } from '../utils/seedRegulatoryRules';

interface Framework {
  id: string;
  framework_code: string;
  framework_name: string;
  regulatory_body: string;
  description: string;
}

interface Rule {
  id: string;
  framework_id: string;
  rule_code: string;
  section_number: string;
  rule_title: string;
  rule_category: string;
  rule_text: string;
  regulatory_citation: string;
  calculation_required: boolean;
  reporting_required: boolean;
}

interface Implementation {
  id: string;
  rule_id: string;
  implementation_status: string;
  implementation_type: string;
  screen_name: string;
  screen_path: string;
  database_table: string;
  coverage_percentage: number;
  implementation_notes: string;
}

interface Gap {
  id: string;
  rule_id: string;
  gap_type: string;
  gap_description: string;
  business_impact: string;
  regulatory_risk: string;
  implementation_suggestion: string;
  priority_level: string;
  status: string;
}

export function RegulatoryCompliance() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'coverage' | 'gaps'>('coverage');
  const [hasData, setHasData] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Check if data exists
    const { data: existingRules, count } = await supabase
      .from('regulatory_rules')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      setHasData(false);
      setLoading(false);
      return;
    }

    setHasData(true);

    // Load all data
    const [fwResult, rulesResult, implResult, gapsResult] = await Promise.all([
      supabase.from('regulatory_frameworks').select('*').order('framework_code'),
      supabase.from('regulatory_rules').select('*').order('rule_code'),
      supabase.from('rule_implementations').select('*'),
      supabase.from('implementation_gaps').select('*')
    ]);

    if (fwResult.data) setFrameworks(fwResult.data);
    if (rulesResult.data) setRules(rulesResult.data);
    if (implResult.data) setImplementations(implResult.data);
    if (gapsResult.data) setGaps(gapsResult.data);

    setLoading(false);
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedRegulatoryRules();
      await loadData();
    } catch (error) {
      console.error('Error seeding regulatory rules:', error);
      alert(`Failed to initialize regulatory rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleRunComplianceAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      console.log('Running compliance analysis...');

      // Application feature inventory
      const appFeatures = {
        'LCR_CALCULATION': {
          screens: ['LCR Dashboard', 'LCR Validation Screen'],
          tables: ['lcr_metrics', 'lcr_calculation_validations', 'lcr_hqla_components'],
          implemented: true
        },
        'NSFR_CALCULATION': {
          screens: ['NSFR Dashboard', 'NSFR Validation Screen'],
          tables: ['nsfr_metrics', 'nsfr_calculation_validations', 'nsfr_asf_components'],
          implemented: true
        },
        'FR2052A_REPORTING': {
          screens: ['FR2052a Dashboard', 'FR2052a Validation'],
          tables: ['fr2052a_submissions', 'fr2052a_data_rows', 'fr2052a_validation_rules'],
          implemented: true
        },
        'DATA_QUALITY': {
          screens: ['Data Quality Dashboard', 'Data Lineage Visualization'],
          tables: ['data_quality_metrics', 'data_lineage'],
          implemented: true
        },
        'STRESS_TESTING': {
          screens: ['Stress Testing Dashboard'],
          tables: ['liquidity_stress_tests', 'stress_test_scenarios'],
          implemented: true
        },
        'RESOLUTION_PLANNING': {
          screens: ['Resolution Planning Module'],
          tables: ['resolution_plans', 'resolution_metrics'],
          implemented: true
        },
        'REGULATORY_REPORTING': {
          screens: ['Regulatory Dashboard', 'Reports Screen'],
          tables: ['regulatory_metrics'],
          implemented: true
        }
      };

      // Clear existing implementations and gaps
      await supabase.from('rule_implementations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('implementation_gaps').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const implementationsToInsert = [];
      const gapsToInsert = [];

      // Analyze each rule
      for (const rule of rules) {
        let implementationStatus = 'not_implemented';
        let coveragePercentage = 0;
        let screenName = null;
        let screenPath = null;
        let databaseTable = null;
        let implementationNotes = 'No implementation found';

        // Match rules to features
        if (rule.rule_category === 'liquidity_coverage' || rule.rule_code.includes('LCR')) {
          const feature = appFeatures['LCR_CALCULATION'];
          implementationStatus = 'implemented';
          coveragePercentage = 100;
          screenName = feature.screens.join(', ');
          screenPath = '/regulatory-dashboard/lcr';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Fully implemented with calculation engine, validation, and component breakdown';
        } else if (rule.rule_category === 'stable_funding' || rule.rule_code.includes('NSFR')) {
          const feature = appFeatures['NSFR_CALCULATION'];
          implementationStatus = 'implemented';
          coveragePercentage = 100;
          screenName = feature.screens.join(', ');
          screenPath = '/regulatory-dashboard/nsfr';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Fully implemented with calculation engine, validation, and component breakdown';
        } else if (rule.rule_category === 'regulatory_reporting' || rule.rule_code.includes('FR2052a')) {
          const feature = appFeatures['FR2052A_REPORTING'];
          implementationStatus = 'implemented';
          coveragePercentage = 100;
          screenName = feature.screens.join(', ');
          screenPath = '/fr2052a-validation';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Fully implemented with data validation, submissions tracking, and error reporting';
        } else if (rule.rule_category === 'data_quality') {
          const feature = appFeatures['DATA_QUALITY'];
          implementationStatus = 'implemented';
          coveragePercentage = 90;
          screenName = feature.screens.join(', ');
          screenPath = '/data-quality';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Implemented with data quality metrics tracking and lineage visualization';
        } else if (rule.rule_category === 'stress_testing') {
          const feature = appFeatures['STRESS_TESTING'];
          implementationStatus = 'partial';
          coveragePercentage = 75;
          screenName = feature.screens.join(', ');
          screenPath = '/stress-testing';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Partial implementation - stress testing framework exists but some scenarios may not be fully configured';
        } else if (rule.rule_category === 'resolution_planning') {
          const feature = appFeatures['RESOLUTION_PLANNING'];
          implementationStatus = 'partial';
          coveragePercentage = 70;
          screenName = feature.screens.join(', ');
          screenPath = '/resolution-planning';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Partial implementation - resolution planning module exists but some requirements may need additional detail';
        } else if (rule.calculation_required || rule.reporting_required) {
          const feature = appFeatures['REGULATORY_REPORTING'];
          implementationStatus = 'partial';
          coveragePercentage = 60;
          screenName = feature.screens.join(', ');
          screenPath = '/regulatory-dashboard';
          databaseTable = feature.tables.join(', ');
          implementationNotes = 'Partial implementation through general regulatory reporting framework';
        }

        // Create implementation record
        implementationsToInsert.push({
          rule_id: rule.id,
          implementation_status: implementationStatus,
          implementation_type: implementationStatus === 'implemented' ? 'automated' : (implementationStatus === 'partial' ? 'semi_automated' : 'manual'),
          screen_name: screenName,
          screen_path: screenPath,
          database_table: databaseTable,
          coverage_percentage: coveragePercentage,
          implementation_notes: implementationNotes,
          last_review_date: new Date().toISOString().split('T')[0],
          reviewer_name: 'System Analysis'
        });

        // Create gap record if not fully implemented
        if (implementationStatus !== 'implemented') {
          gapsToInsert.push({
            rule_id: rule.id,
            gap_type: implementationStatus === 'not_implemented' ? 'missing_functionality' : 'incomplete_implementation',
            gap_description: implementationStatus === 'not_implemented'
              ? `No implementation found for ${rule.rule_title}`
              : `Partial implementation for ${rule.rule_title} - may require additional features or validation`,
            business_impact: implementationStatus === 'not_implemented' ? 'Cannot fully comply with regulatory requirement' : 'May not fully satisfy all aspects of regulatory requirement',
            regulatory_risk: implementationStatus === 'not_implemented' ? 'high' : 'medium',
            implementation_suggestion: implementationStatus === 'not_implemented'
              ? `Develop dedicated screen and calculation logic for ${rule.rule_category}`
              : `Review and enhance existing implementation to cover all aspects of ${rule.rule_code}`,
            priority_level: rule.calculation_required || rule.reporting_required ? 'high' : 'medium',
            status: 'open',
            identified_date: new Date().toISOString().split('T')[0]
          });
        }
      }

      // Batch insert implementations
      if (implementationsToInsert.length > 0) {
        const { error: implError } = await supabase
          .from('rule_implementations')
          .insert(implementationsToInsert);

        if (implError) {
          console.error('Error inserting implementations:', implError);
          throw new Error(`Failed to save implementations: ${implError.message}`);
        }
      }

      // Batch insert gaps
      if (gapsToInsert.length > 0) {
        const { error: gapError } = await supabase
          .from('implementation_gaps')
          .insert(gapsToInsert);

        if (gapError) {
          console.error('Error inserting gaps:', gapError);
          throw new Error(`Failed to save gaps: ${gapError.message}`);
        }
      }

      console.log(`Analysis complete: ${implementationsToInsert.length} implementations, ${gapsToInsert.length} gaps identified`);

      // Reload data
      await loadData();

      alert(`Compliance Analysis Complete!\n\n` +
        `✓ Analyzed ${rules.length} regulatory rules\n` +
        `✓ Created ${implementationsToInsert.length} implementation records\n` +
        `✓ Identified ${gapsToInsert.length} gaps\n\n` +
        `Review the Coverage View to see implementation status.`);

    } catch (error) {
      console.error('Compliance analysis failed:', error);
      alert(`Compliance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  const getImplementationsForRule = (ruleId: string) => {
    return implementations.filter(i => i.rule_id === ruleId);
  };

  const getGapsForRule = (ruleId: string) => {
    return gaps.filter(g => g.rule_id === ruleId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'not_implemented':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_implemented':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getOverallStatus = (rule: Rule): string => {
    const impls = getImplementationsForRule(rule.id);
    if (impls.length === 0) return 'not_implemented';
    if (impls.every(i => i.implementation_status === 'implemented')) return 'implemented';
    if (impls.some(i => i.implementation_status === 'not_implemented')) return 'partial';
    return 'partial';
  };

  const filteredRules = rules.filter(rule => {
    if (selectedFramework !== 'all' && rule.framework_id !== selectedFramework) return false;
    if (selectedCategory !== 'all' && rule.rule_category !== selectedCategory) return false;
    if (searchQuery && !rule.rule_title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !rule.rule_code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = Array.from(new Set(rules.map(r => r.rule_category)));

  const stats = {
    total: rules.length,
    implemented: rules.filter(r => getOverallStatus(r) === 'implemented').length,
    partial: rules.filter(r => getOverallStatus(r) === 'partial').length,
    notImplemented: rules.filter(r => getOverallStatus(r) === 'not_implemented').length,
    criticalGaps: gaps.filter(g => g.priority_level === 'critical' && g.status === 'open').length,
    highGaps: gaps.filter(g => g.priority_level === 'high' && g.status === 'open').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading regulatory compliance data...</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Regulatory Data Available</h3>
          <p className="text-slate-600 mb-6">
            Initialize the regulatory compliance tracking system with predefined rules from Regulation YY, WW, QQ, and NSFR.
          </p>
          <button
            onClick={handleSeedData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Initialize Regulatory Rules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Regulatory Compliance Tracking
          </h2>
          <p className="text-slate-600 mt-1">
            Track implementation status across Regulation YY, WW, QQ, and NSFR requirements
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunComplianceAnalysis}
            disabled={isAnalyzing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAnalyzing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Compliance Analysis'}
          </button>
          <button
            onClick={() => setViewMode('coverage')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'coverage'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Coverage View
          </button>
          <button
            onClick={() => setViewMode('gaps')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'gaps'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Gaps View
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Rules</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Implemented</p>
          <p className="text-2xl font-bold text-green-600">{stats.implemented}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Partial</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Not Impl.</p>
          <p className="text-2xl font-bold text-red-600">{stats.notImplemented}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Critical Gaps</p>
          <p className="text-2xl font-bold text-red-600">{stats.criticalGaps}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">High Gaps</p>
          <p className="text-2xl font-bold text-orange-600">{stats.highGaps}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Regulation
            </label>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Regulations</option>
              {frameworks.map(fw => (
                <option key={fw.id} value={fw.id}>{fw.framework_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.map(rule => {
          const isExpanded = expandedRules.has(rule.id);
          const status = getOverallStatus(rule);
          const impls = getImplementationsForRule(rule.id);
          const ruleGaps = getGapsForRule(rule.id);
          const framework = frameworks.find(f => f.id === rule.framework_id);

          return (
            <div key={rule.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleRule(rule.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      {getStatusIcon(status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{rule.rule_code}</span>
                          <span className="text-sm text-slate-600">{rule.section_number}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(status)}`}>
                            {status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-900">{rule.rule_title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{framework?.framework_name} • {rule.rule_category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {rule.calculation_required && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Calculation</span>
                    )}
                    {rule.reporting_required && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Reporting</span>
                    )}
                    {ruleGaps.length > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{ruleGaps.length} Gap(s)</span>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                  {/* Rule Text */}
                  <div>
                    <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Regulatory Requirement
                    </h5>
                    <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{rule.rule_text}</p>
                    <p className="text-xs text-slate-500 mt-1">Citation: {rule.regulatory_citation}</p>
                  </div>

                  {/* Implementations */}
                  {impls.length > 0 && (
                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Implementation Details</h5>
                      <div className="space-y-2">
                        {impls.map(impl => (
                          <div key={impl.id} className="bg-white p-3 rounded border border-slate-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(impl.implementation_status)}`}>
                                  {impl.implementation_status.toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-slate-900">{impl.screen_name || impl.implementation_type}</span>
                              </div>
                              <span className="text-sm font-semibold text-blue-600">{impl.coverage_percentage}%</span>
                            </div>
                            {impl.screen_path && (
                              <p className="text-xs text-slate-600 mb-1">📍 {impl.screen_path}</p>
                            )}
                            {impl.database_table && (
                              <p className="text-xs text-slate-600 mb-1">🗄️ Table: {impl.database_table}</p>
                            )}
                            <p className="text-sm text-slate-700">{impl.implementation_notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Implementation Gaps */}
                  {ruleGaps.length > 0 && (
                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Implementation Gaps</h5>
                      <div className="space-y-2">
                        {ruleGaps.map(gap => (
                          <div key={gap.id} className="bg-orange-50 border border-orange-200 p-3 rounded">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(gap.priority_level)}`}>
                                  {gap.priority_level?.toUpperCase()}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${getRiskColor(gap.regulatory_risk)}`}>
                                  {gap.regulatory_risk?.toUpperCase()} RISK
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-slate-900 mb-1">{gap.gap_description}</p>
                            <p className="text-sm text-slate-700 mb-2"><strong>Impact:</strong> {gap.business_impact}</p>
                            <div className="bg-white p-2 rounded border border-orange-200">
                              <p className="text-xs font-medium text-slate-700 mb-1">💡 Suggested Implementation:</p>
                              <p className="text-sm text-slate-700">{gap.implementation_suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {impls.length === 0 && ruleGaps.length === 0 && (
                    <div className="text-center text-slate-500 py-4">
                      No implementation details or gaps recorded
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No rules match the selected filters
        </div>
      )}
    </div>
  );
}
