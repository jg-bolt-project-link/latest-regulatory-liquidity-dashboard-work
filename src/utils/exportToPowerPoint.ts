import pptxgen from 'pptxgenjs';

interface MetricData {
  name: string;
  currentValue: string | number;
  priorValue?: string | number;
  regulatoryRequirement?: string;
  internalRequirement?: string;
  currentDate?: string;
  priorDate?: string;
  delta?: string;
  status?: 'compliant' | 'warning' | 'non-compliant';
}

interface ExportOptions {
  title: string;
  subtitle: string;
  metrics: MetricData[];
  additionalNotes?: string;
}

export function exportMetricsToPowerPoint(options: ExportOptions) {
  const pres = new pptxgen();

  pres.author = 'Liquidity Risk Management System';
  pres.company = 'Financial Institution';
  pres.title = options.title;
  pres.subject = 'Regulatory Metrics Summary';

  const slide = pres.addSlide();

  slide.background = { color: 'FFFFFF' };

  slide.addText(options.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: '1e293b',
    align: 'left'
  });

  slide.addText(options.subtitle, {
    x: 0.5,
    y: 0.95,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: '64748b',
    align: 'left'
  });

  const tableData: any[] = [];

  tableData.push([
    { text: 'Metric', options: { bold: true, fontSize: 10, color: 'FFFFFF', fill: '1e40af' } },
    { text: 'Current Value', options: { bold: true, fontSize: 10, color: 'FFFFFF', fill: '1e40af', align: 'right' } },
    { text: 'Prior Period', options: { bold: true, fontSize: 10, color: 'FFFFFF', fill: '1e40af', align: 'right' } },
    { text: 'Change', options: { bold: true, fontSize: 10, color: 'FFFFFF', fill: '1e40af', align: 'right' } },
    { text: 'Requirement', options: { bold: true, fontSize: 10, color: 'FFFFFF', fill: '1e40af', align: 'right' } },
    { text: 'Status', options: { bold: true, fontSize: 10, color: 'FFFFFF', fill: '1e40af', align: 'center' } }
  ]);

  options.metrics.forEach((metric, index) => {
    const bgColor = index % 2 === 0 ? 'f8fafc' : 'FFFFFF';

    let statusText = '';
    let statusColor = '64748b';
    if (metric.status === 'compliant') {
      statusText = '✓ Compliant';
      statusColor = '16a34a';
    } else if (metric.status === 'warning') {
      statusText = '⚠ Warning';
      statusColor = 'f59e0b';
    } else if (metric.status === 'non-compliant') {
      statusText = '✗ Non-Compliant';
      statusColor = 'dc2626';
    }

    const requirement = metric.regulatoryRequirement || metric.internalRequirement || 'N/A';

    tableData.push([
      { text: metric.name, options: { fontSize: 9, color: '1e293b', fill: bgColor, bold: true } },
      {
        text: `${metric.currentValue}${metric.currentDate ? `\n(${metric.currentDate})` : ''}`,
        options: { fontSize: 9, color: '1e293b', fill: bgColor, align: 'right' }
      },
      {
        text: metric.priorValue ? `${metric.priorValue}${metric.priorDate ? `\n(${metric.priorDate})` : ''}` : 'N/A',
        options: { fontSize: 9, color: '64748b', fill: bgColor, align: 'right' }
      },
      {
        text: metric.delta || 'N/A',
        options: {
          fontSize: 9,
          color: metric.delta && metric.delta.startsWith('+') ? '16a34a' : metric.delta && metric.delta.startsWith('-') ? 'dc2626' : '64748b',
          fill: bgColor,
          align: 'right',
          bold: true
        }
      },
      { text: requirement, options: { fontSize: 9, color: '1e293b', fill: bgColor, align: 'right' } },
      { text: statusText, options: { fontSize: 9, color: statusColor, fill: bgColor, align: 'center', bold: true } }
    ]);
  });

  slide.addTable(tableData, {
    x: 0.5,
    y: 1.4,
    w: 9,
    rowH: [0.35, ...Array(options.metrics.length).fill(0.45)],
    colW: [2.5, 1.5, 1.5, 1.0, 1.5, 1.0],
    border: { pt: 1, color: 'e2e8f0' },
    margin: 0.1,
    fontSize: 9
  });

  const summaryY = 1.4 + 0.35 + (options.metrics.length * 0.45) + 0.3;

  if (summaryY < 6.8) {
    const complianceMetrics = options.metrics.filter(m => m.status);
    const compliant = complianceMetrics.filter(m => m.status === 'compliant').length;
    const warning = complianceMetrics.filter(m => m.status === 'warning').length;
    const nonCompliant = complianceMetrics.filter(m => m.status === 'non-compliant').length;

    if (complianceMetrics.length > 0) {
      slide.addText('Summary', {
        x: 0.5,
        y: summaryY,
        w: 9,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: '1e293b'
      });

      const summaryText = `${compliant} metric${compliant !== 1 ? 's' : ''} compliant  •  ${warning} warning${warning !== 1 ? 's' : ''}  •  ${nonCompliant} non-compliant`;

      slide.addText(summaryText, {
        x: 0.5,
        y: summaryY + 0.35,
        w: 9,
        h: 0.3,
        fontSize: 11,
        color: '64748b'
      });
    }

    if (options.additionalNotes && summaryY + 0.8 < 6.8) {
      slide.addText(options.additionalNotes, {
        x: 0.5,
        y: summaryY + 0.8,
        w: 9,
        h: 0.6,
        fontSize: 9,
        color: '475569',
        italic: true
      });
    }
  }

  slide.addText(`Generated: ${new Date().toLocaleString()}`, {
    x: 0.5,
    y: 7.0,
    w: 9,
    h: 0.2,
    fontSize: 8,
    color: '94a3b8',
    align: 'right'
  });

  const fileName = `${options.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  pres.writeFile({ fileName });
}

export function exportBalanceSheetToPPT(data: any) {
  const metrics: MetricData[] = [
    {
      name: 'Total Assets',
      currentValue: data.currentAssets || 'N/A',
      priorValue: data.priorAssets,
      delta: data.assetsDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: 'N/A',
      status: 'compliant'
    },
    {
      name: 'Total Liabilities',
      currentValue: data.currentLiabilities || 'N/A',
      priorValue: data.priorLiabilities,
      delta: data.liabilitiesDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: 'N/A',
      status: 'compliant'
    },
    {
      name: 'Total Equity',
      currentValue: data.currentEquity || 'N/A',
      priorValue: data.priorEquity,
      delta: data.equityDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: 'N/A',
      status: 'compliant'
    },
    {
      name: 'Tier 1 Capital Ratio',
      currentValue: data.currentTier1Ratio || 'N/A',
      priorValue: data.priorTier1Ratio,
      delta: data.tier1RatioDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 6.0%',
      status: data.tier1Status || 'compliant'
    },
    {
      name: 'Leverage Ratio',
      currentValue: data.currentLeverageRatio || 'N/A',
      priorValue: data.priorLeverageRatio,
      delta: data.leverageRatioDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 5.0%',
      status: data.leverageStatus || 'compliant'
    }
  ];

  exportMetricsToPowerPoint({
    title: 'Balance Sheet & Capital Summary',
    subtitle: 'Key metrics vs regulatory requirements and prior period comparison',
    metrics,
    additionalNotes: 'Source: State Street Corporation quarterly reports. Representative sample data for demonstration.'
  });
}

export function exportCapitalMetricsToPPT(data: any) {
  const metrics: MetricData[] = [
    {
      name: 'Tier 1 Capital',
      currentValue: data.currentTier1Capital || 'N/A',
      priorValue: data.priorTier1Capital,
      delta: data.tier1CapitalDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: 'N/A',
      status: 'compliant'
    },
    {
      name: 'Tier 1 Capital Ratio',
      currentValue: data.currentTier1Ratio || 'N/A',
      priorValue: data.priorTier1Ratio,
      delta: data.tier1RatioDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 6.0%',
      internalRequirement: '≥ 8.0%',
      status: data.tier1Status || 'compliant'
    },
    {
      name: 'Leverage Ratio',
      currentValue: data.currentLeverageRatio || 'N/A',
      priorValue: data.priorLeverageRatio,
      delta: data.leverageRatioDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 5.0%',
      internalRequirement: '≥ 6.0%',
      status: data.leverageStatus || 'compliant'
    },
    {
      name: 'RCAP Ratio',
      currentValue: data.currentRCAPRatio || 'N/A',
      priorValue: data.priorRCAPRatio,
      delta: data.rcapRatioDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 100%',
      internalRequirement: '≥ 110%',
      status: data.rcapStatus || 'compliant'
    }
  ];

  exportMetricsToPowerPoint({
    title: 'Capital Adequacy Summary',
    subtitle: 'Regulatory and resolution capital metrics vs requirements',
    metrics,
    additionalNotes: 'Regulatory capital ratios based on Basel III requirements. Resolution metrics represent demonstration data.'
  });
}

export function exportLiquidityMetricsToPPT(data: any) {
  const metrics: MetricData[] = [
    {
      name: 'Liquidity Coverage Ratio (LCR)',
      currentValue: data.currentLCR || 'N/A',
      priorValue: data.priorLCR,
      delta: data.lcrDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 100%',
      internalRequirement: '≥ 110%',
      status: data.lcrStatus || 'compliant'
    },
    {
      name: 'Net Stable Funding Ratio (NSFR)',
      currentValue: data.currentNSFR || 'N/A',
      priorValue: data.priorNSFR,
      delta: data.nsfrDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: '≥ 100%',
      internalRequirement: '≥ 105%',
      status: data.nsfrStatus || 'compliant'
    },
    {
      name: 'High-Quality Liquid Assets (HQLA)',
      currentValue: data.currentHQLA || 'N/A',
      priorValue: data.priorHQLA,
      delta: data.hqlaDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: 'N/A',
      status: 'compliant'
    },
    {
      name: 'Net Cash Outflows (30-day)',
      currentValue: data.currentNetOutflows || 'N/A',
      priorValue: data.priorNetOutflows,
      delta: data.netOutflowsDelta,
      currentDate: data.currentDate,
      priorDate: data.priorDate,
      regulatoryRequirement: 'N/A',
      status: 'compliant'
    }
  ];

  exportMetricsToPowerPoint({
    title: 'Liquidity Metrics Summary',
    subtitle: 'LCR, NSFR, and liquidity components vs requirements',
    metrics,
    additionalNotes: 'Representative sample data modeled on typical institutional liquidity metrics per Basel III standards.'
  });
}
