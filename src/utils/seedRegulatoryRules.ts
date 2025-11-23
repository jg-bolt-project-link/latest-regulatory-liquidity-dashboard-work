import { supabase } from '../lib/supabase';

export async function seedRegulatoryRules() {
  console.log('🔧 Seeding regulatory rules...');

  // Get framework IDs
  const { data: frameworks } = await supabase
    .from('regulatory_frameworks')
    .select('id, framework_code');

  if (!frameworks) {
    console.error('No frameworks found');
    return;
  }

  const regYY = frameworks.find(f => f.framework_code === 'REG_YY')?.id;
  const regWW = frameworks.find(f => f.framework_code === 'REG_WW')?.id;
  const regQQ = frameworks.find(f => f.framework_code === 'REG_QQ')?.id;
  const nsfr = frameworks.find(f => f.framework_code === 'NSFR')?.id;

  // Rule 1: LCR
  const { data: lcrRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regYY,
      rule_code: 'YY_252_30',
      section_number: '252.30',
      rule_title: 'Liquidity Coverage Ratio (LCR)',
      rule_category: 'Liquidity Risk Management',
      rule_text: 'A covered company must calculate and maintain a liquidity coverage ratio that is equal to or greater than 1.0 on each business day. The LCR equals HQLA divided by total net cash outflows over a 30-day stress period.',
      regulatory_citation: '12 CFR 252.30',
      calculation_required: true,
      reporting_required: true
    })
    .select()
    .single();

  if (lcrRule) {
    await supabase.from('rule_implementations').insert([
      {
        rule_id: lcrRule.id,
        implementation_status: 'implemented',
        implementation_type: 'calculation',
        screen_name: 'LCR View',
        screen_path: '/regulatory-dashboard → LCR',
        database_table: 'lcr_metrics',
        coverage_percentage: 100,
        implementation_notes: 'Fully implemented with HQLA Level 1, 2A, 2B and net cash outflow calculations'
      },
      {
        rule_id: lcrRule.id,
        implementation_status: 'implemented',
        implementation_type: 'screen',
        screen_name: 'LCR Validation Screen',
        screen_path: '/regulatory-dashboard → LCR → Validation',
        database_table: 'lcr_calculation_validations',
        coverage_percentage: 100,
        implementation_notes: 'Component breakdowns with drill-down to source records'
      }
    ]);
  }

  // Rule 2: NSFR
  const { data: nsfrRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regYY,
      rule_code: 'YY_252_100',
      section_number: '252.100',
      rule_title: 'Net Stable Funding Ratio (NSFR)',
      rule_category: 'Liquidity Risk Management',
      rule_text: 'A covered company must maintain a net stable funding ratio ≥ 1.0 on an ongoing basis, calculated as ASF / RSF.',
      regulatory_citation: '12 CFR 252.100',
      calculation_required: true,
      reporting_required: true
    })
    .select()
    .single();

  if (nsfrRule) {
    await supabase.from('rule_implementations').insert([
      {
        rule_id: nsfrRule.id,
        implementation_status: 'implemented',
        implementation_type: 'calculation',
        screen_name: 'NSFR View',
        screen_path: '/regulatory-dashboard → NSFR',
        database_table: 'nsfr_metrics',
        coverage_percentage: 100,
        implementation_notes: 'ASF and RSF calculations with appropriate factors'
      }
    ]);
  }

  // Rule 3: Capital Requirements
  const { data: capRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regYY,
      rule_code: 'YY_252_10',
      section_number: '252.10',
      rule_title: 'Minimum Capital Requirements',
      rule_category: 'Capital Standards',
      rule_text: 'Covered company must maintain minimum capital ratios: CET1 ≥ 4.5%, Tier 1 ≥ 6%, Total ≥ 8%.',
      regulatory_citation: '12 CFR 252.10',
      calculation_required: true,
      reporting_required: true
    })
    .select()
    .single();

  if (capRule) {
    await supabase.from('rule_implementations').insert([
      {
        rule_id: capRule.id,
        implementation_status: 'implemented',
        implementation_type: 'screen',
        screen_name: 'Capital Metrics',
        screen_path: '/executive-dashboard → Capital Metrics',
        database_table: 'balance_sheet_metrics',
        coverage_percentage: 95,
        implementation_notes: 'Tracks Tier 1 capital and ratios'
      }
    ]);

    await supabase.from('implementation_gaps').insert({
      rule_id: capRule.id,
      gap_type: 'missing_validation',
      gap_description: 'No automated alerting when capital ratios fall below regulatory thresholds',
      business_impact: 'Manual monitoring required; risk of delayed response',
      regulatory_risk: 'medium',
      implementation_suggestion: 'Add validation rules triggering alerts when Tier 1 < 6% or Total < 8%',
      priority_level: 'medium'
    });
  }

  // Rule 4: Stress Testing
  const { data: stressRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regYY,
      rule_code: 'YY_252_12',
      section_number: '252.12-252.15',
      rule_title: 'Capital Stress Testing (CCAR/DFAST)',
      rule_category: 'Stress Testing',
      rule_text: 'Covered company must conduct annual stress tests including baseline, adverse, and severely adverse scenarios.',
      regulatory_citation: '12 CFR 252.12-252.15',
      calculation_required: true,
      reporting_required: true
    })
    .select()
    .single();

  if (stressRule) {
    await supabase.from('implementation_gaps').insert({
      rule_id: stressRule.id,
      gap_type: 'missing_screen',
      gap_description: 'No comprehensive stress testing dashboard with scenario management',
      business_impact: 'Unable to properly document CCAR/DFAST results',
      regulatory_risk: 'high',
      implementation_suggestion: 'Create StressTestingDashboard with scenario definition, stressed assumptions, post-stress capital calculations',
      priority_level: 'high'
    });
  }

  // Rule 5: FR 2052a
  const { data: frRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regYY,
      rule_code: 'FR2052a',
      section_number: 'FR 2052a',
      rule_title: 'Complex Institution Liquidity Monitoring Report',
      rule_category: 'Regulatory Reporting',
      rule_text: 'Collects detailed information on liquidity, funding sources, and liquidity metrics for large institutions.',
      regulatory_citation: 'FR 2052a Instructions',
      calculation_required: true,
      reporting_required: true
    })
    .select()
    .single();

  if (frRule) {
    await supabase.from('rule_implementations').insert([
      {
        rule_id: frRule.id,
        implementation_status: 'implemented',
        implementation_type: 'report',
        screen_name: 'FR 2052a Dashboard',
        screen_path: '/fr2052a-report',
        database_table: 'fr2052a_submissions',
        coverage_percentage: 95,
        implementation_notes: 'Full submission tracking and data quality dashboard'
      }
    ]);

    await supabase.from('implementation_gaps').insert({
      rule_id: frRule.id,
      gap_type: 'incomplete_coverage',
      gap_description: 'FR 2052a submission exports not implemented',
      business_impact: 'Manual export process required for Fed submission',
      regulatory_risk: 'medium',
      implementation_suggestion: 'Implement FR2052aExportGenerator creating properly formatted CSV files',
      priority_level: 'medium'
    });
  }

  // Rule 6: Resolution Planning (Reg WW)
  const { data: resRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regWW,
      rule_code: 'WW_381_1',
      section_number: '381.1-381.10',
      rule_title: 'Resolution Plan Requirements (165(d))',
      rule_category: 'Resolution Planning',
      rule_text: 'Each covered company must submit periodically a plan for rapid and orderly resolution identifying critical operations and core business lines.',
      regulatory_citation: '12 CFR 381.1-381.10',
      calculation_required: false,
      reporting_required: true
    })
    .select()
    .single();

  if (resRule) {
    await supabase.from('implementation_gaps').insert({
      rule_id: resRule.id,
      gap_type: 'missing_screen',
      gap_description: 'No module to identify and track critical operations and core business lines',
      business_impact: 'Resolution plan may be incomplete',
      regulatory_risk: 'high',
      implementation_suggestion: 'Create ResolutionPlanningModule with critical operations registry, core business lines, material entities',
      priority_level: 'high'
    });
  }

  // Rule 7: Cash Flow Projections (Reg QQ)
  const { data: cfRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regQQ,
      rule_code: 'QQ_39_3',
      section_number: '39.3',
      rule_title: 'Cash Flow Projections',
      rule_category: 'Liquidity Risk Management',
      rule_text: 'Covered bank must produce comprehensive cash flow projections over short- and long-term horizons.',
      regulatory_citation: '12 CFR 39.3(c)',
      calculation_required: true,
      reporting_required: false
    })
    .select()
    .single();

  if (cfRule) {
    await supabase.from('implementation_gaps').insert({
      rule_id: cfRule.id,
      gap_type: 'missing_calculation',
      gap_description: 'No forward-looking cash flow projection model with multiple time horizons',
      business_impact: 'Unable to project liquidity needs proactively',
      regulatory_risk: 'high',
      implementation_suggestion: 'Implement CashFlowProjections with 30/90/365-day horizons, scenario assumptions, expected flows',
      priority_level: 'high'
    });
  }

  // Rule 8: Contingency Funding Plan
  const { data: cfpRule } = await supabase
    .from('regulatory_rules')
    .insert({
      framework_id: regQQ,
      rule_code: 'QQ_39_4',
      section_number: '39.4',
      rule_title: 'Contingency Funding Plan',
      rule_category: 'Liquidity Risk Management',
      rule_text: 'Covered bank must establish and maintain a CFP setting out strategies for addressing liquidity needs during stress.',
      regulatory_citation: '12 CFR 39.4',
      calculation_required: false,
      reporting_required: false
    })
    .select()
    .single();

  if (cfpRule) {
    await supabase.from('implementation_gaps').insert({
      rule_id: cfpRule.id,
      gap_type: 'missing_screen',
      gap_description: 'No contingency funding plan module or stress event tracking',
      business_impact: 'CFP documentation scattered; difficult to execute during stress',
      regulatory_risk: 'high',
      implementation_suggestion: 'Create ContingencyFundingPlan component with funding sources, triggers, procedures, testing log',
      priority_level: 'high'
    });
  }

  console.log('✅ Regulatory rules seeded');
}
