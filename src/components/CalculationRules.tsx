import { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, FileText, Calculator, Shield, TrendingUp, Droplets, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CalculationRule {
  id: string;
  rule_code: string;
  rule_category: string;
  rule_name: string;
  fr2052a_appendix_reference: string;
  calculation_formula: string;
  factor_applied: number | null;
  rule_description: string;
  regulatory_citation: string | null;
  examples: string | null;
}

interface RuleCategory {
  name: string;
  displayName: string;
  icon: any;
  description: string;
  rules: CalculationRule[];
}

export function CalculationRules() {
  const [rules, setRules] = useState<CalculationRule[]>([]);
  const [categories, setCategories] = useState<RuleCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    if (rules.length > 0) {
      organizeByCategory();
    }
  }, [rules, searchTerm, selectedCategory]);

  const loadRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lcr_calculation_rules')
      .select('*')
      .order('rule_category', { ascending: true })
      .order('rule_code', { ascending: true });

    if (data && !error) {
      setRules(data);
    }
    setLoading(false);
  };

  const organizeByCategory = () => {
    const categoryMap = new Map<string, CalculationRule[]>();

    const filteredRules = rules.filter(rule => {
      const matchesSearch = searchTerm === '' ||
        rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.rule_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.rule_description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || rule.rule_category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    filteredRules.forEach(rule => {
      if (!categoryMap.has(rule.rule_category)) {
        categoryMap.set(rule.rule_category, []);
      }
      categoryMap.get(rule.rule_category)!.push(rule);
    });

    const categoryDefinitions: { [key: string]: { displayName: string; icon: any; description: string } } = {
      'HQLA_Level_1': {
        displayName: 'HQLA - Level 1 Assets',
        icon: Shield,
        description: 'Highest quality liquid assets with 0% haircut'
      },
      'HQLA_Level_2A': {
        displayName: 'HQLA - Level 2A Assets',
        icon: Shield,
        description: 'High-quality liquid assets with 15% haircut, subject to 40% cap'
      },
      'HQLA_Level_2B': {
        displayName: 'HQLA - Level 2B Assets',
        icon: Shield,
        description: 'Liquid assets with 50% haircut, subject to 15% cap'
      },
      'Cash_Outflows_Retail': {
        displayName: 'Cash Outflows - Retail',
        icon: TrendingUp,
        description: 'Retail deposit outflow assumptions'
      },
      'Cash_Outflows_Wholesale': {
        displayName: 'Cash Outflows - Wholesale',
        icon: TrendingUp,
        description: 'Wholesale funding outflow assumptions'
      },
      'Cash_Outflows_Secured': {
        displayName: 'Cash Outflows - Secured Funding',
        icon: TrendingUp,
        description: 'Secured funding and collateral outflows'
      },
      'Cash_Outflows_Derivatives': {
        displayName: 'Cash Outflows - Derivatives',
        icon: Calculator,
        description: 'Derivative and other contractual outflows'
      },
      'Cash_Outflows_Commitments': {
        displayName: 'Cash Outflows - Commitments',
        icon: FileText,
        description: 'Credit and liquidity facility commitments'
      },
      'Cash_Inflows_Contractual': {
        displayName: 'Cash Inflows - Contractual',
        icon: Droplets,
        description: 'Contractual cash inflows from maturing assets'
      },
      'Cash_Inflows_Cap': {
        displayName: 'Cash Inflows - Cap',
        icon: Droplets,
        description: 'Inflow cap at 75% of total outflows'
      },
      'NSFR_ASF': {
        displayName: 'NSFR - Available Stable Funding',
        icon: Shield,
        description: 'Available Stable Funding factors for NSFR'
      },
      'NSFR_RSF': {
        displayName: 'NSFR - Required Stable Funding',
        icon: TrendingUp,
        description: 'Required Stable Funding factors for NSFR'
      }
    };

    const organizedCategories: RuleCategory[] = [];
    categoryMap.forEach((categoryRules, categoryName) => {
      const def = categoryDefinitions[categoryName] || {
        displayName: categoryName,
        icon: BookOpen,
        description: 'Regulatory calculation rules'
      };

      organizedCategories.push({
        name: categoryName,
        displayName: def.displayName,
        icon: def.icon,
        description: def.description,
        rules: categoryRules
      });
    });

    setCategories(organizedCategories);
  };

  const toggleRule = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const uniqueCategories = Array.from(new Set(rules.map(r => r.rule_category)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">LCR & NSFR Calculation Rules</h1>
        <p className="text-slate-600 mt-1">
          Comprehensive regulatory calculation rules from FR 2052a Appendix VI
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search rules by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{categories.reduce((sum, cat) => sum + cat.rules.length, 0)}</span> rules found
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{categories.length}</span> categories
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading calculation rules...</p>
        </div>
      )}

      {/* Categories */}
      {!loading && categories.length > 0 && (
        <div className="space-y-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.name} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{category.displayName}</h2>
                        <p className="text-sm text-slate-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-slate-500">
                      {category.rules.length} {category.rules.length === 1 ? 'rule' : 'rules'}
                    </div>
                  </div>
                </div>

                {/* Rules List */}
                <div className="divide-y divide-slate-200">
                  {category.rules.map((rule) => {
                    const isExpanded = expandedRules.has(rule.id);
                    return (
                      <div key={rule.id} className="hover:bg-slate-50 transition-colors">
                        {/* Rule Header */}
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className="w-full px-6 py-4 flex items-start justify-between text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="px-2 py-1 text-xs font-mono font-semibold bg-blue-100 text-blue-800 rounded">
                                {rule.rule_code}
                              </span>
                              <h3 className="text-base font-semibold text-slate-900">{rule.rule_name}</h3>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{rule.rule_description}</p>
                          </div>
                          <div className="flex items-center space-x-4 ml-4">
                            {rule.factor_applied !== null && (
                              <div className="text-right">
                                <div className="text-xs text-slate-500">Factor</div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {(parseFloat(rule.factor_applied.toString()) * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}
                            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            </div>
                          </div>
                        </button>

                        {/* Rule Details */}
                        {isExpanded && (
                          <div className="px-6 pb-6 space-y-4">
                            {/* Calculation Formula */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                <Calculator className="w-4 h-4 mr-2" />
                                Calculation Formula
                              </h4>
                              <p className="text-sm text-slate-900 font-mono bg-white border border-slate-200 rounded px-3 py-2">
                                {rule.calculation_formula}
                              </p>
                            </div>

                            {/* Regulatory Reference */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  FR 2052a Reference
                                </h4>
                                <p className="text-sm text-slate-900">{rule.fr2052a_appendix_reference}</p>
                              </div>
                              {rule.regulatory_citation && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Regulatory Citation
                                  </h4>
                                  <p className="text-sm text-slate-900">{rule.regulatory_citation}</p>
                                </div>
                              )}
                            </div>

                            {/* Examples */}
                            {rule.examples && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Examples</h4>
                                <div className="text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  {rule.examples}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!loading && categories.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-lg">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No calculation rules found</h3>
          <p className="text-slate-600">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No calculation rules are currently loaded in the system'}
          </p>
        </div>
      )}
    </div>
  );
}
