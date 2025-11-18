export interface UIValidationRule {
  name: string;
  description: string;
  check: () => boolean;
  severity: 'critical' | 'warning' | 'info';
}

export interface UIValidationResult {
  passed: boolean;
  rule: UIValidationRule;
  message: string;
}

export class UIValidator {
  private rules: UIValidationRule[] = [];

  addRule(rule: UIValidationRule) {
    this.rules.push(rule);
  }

  validate(): UIValidationResult[] {
    return this.rules.map(rule => {
      const passed = rule.check();
      return {
        passed,
        rule,
        message: passed
          ? `✓ ${rule.name}: Passed`
          : `✗ ${rule.name}: ${rule.description}`
      };
    });
  }

  getCriticalFailures(): UIValidationResult[] {
    return this.validate().filter(
      result => !result.passed && result.rule.severity === 'critical'
    );
  }

  hasAnyCriticalFailures(): boolean {
    return this.getCriticalFailures().length > 0;
  }

  getReport(): string {
    const results = this.validate();
    const critical = results.filter(r => !r.passed && r.rule.severity === 'critical');
    const warnings = results.filter(r => !r.passed && r.rule.severity === 'warning');
    const passed = results.filter(r => r.passed);

    let report = '=== UI Validation Report ===\n\n';

    if (critical.length > 0) {
      report += '🔴 CRITICAL ISSUES:\n';
      critical.forEach(r => report += `  ${r.message}\n`);
      report += '\n';
    }

    if (warnings.length > 0) {
      report += '⚠️  WARNINGS:\n';
      warnings.forEach(r => report += `  ${r.message}\n`);
      report += '\n';
    }

    report += `✅ PASSED: ${passed.length}/${results.length} checks\n`;

    if (critical.length === 0 && warnings.length === 0) {
      report += '\n🎉 All validations passed!\n';
    }

    return report;
  }
}

export const dashboardUIValidator = new UIValidator();

dashboardUIValidator.addRule({
  name: 'Seed Sample Data Button Exists',
  description: 'The "Seed Sample Data" button must be present in the Executive Dashboard',
  severity: 'critical',
  check: () => {
    if (typeof document === 'undefined') return true;

    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(btn =>
      btn.textContent?.includes('Seed Sample Data') ||
      btn.title?.includes('sample data')
    );
  }
});

dashboardUIValidator.addRule({
  name: 'Seed Button Text Consistency',
  description: 'References to the seed button should use consistent text: "Seed Sample Data"',
  severity: 'warning',
  check: () => {
    if (typeof document === 'undefined') return true;

    const body = document.body.textContent || '';
    const hasSeedSampleData = body.includes('Seed Sample Data');
    const hasRefreshData = body.includes('Refresh Data');

    return hasSeedSampleData && !hasRefreshData;
  }
});

dashboardUIValidator.addRule({
  name: 'FR2052a Empty State Message',
  description: 'FR2052a screen should reference the correct button name in empty state',
  severity: 'critical',
  check: () => {
    if (typeof document === 'undefined') return true;

    const body = document.body.textContent || '';
    if (!body.includes('No FR 2052a Data Found')) return true;

    return body.includes('Seed Sample Data');
  }
});

dashboardUIValidator.addRule({
  name: 'Seed Button Visibility',
  description: 'Seed Sample Data button must be visible (not hidden by CSS)',
  severity: 'critical',
  check: () => {
    if (typeof document === 'undefined') return true;

    const buttons = Array.from(document.querySelectorAll('button'));
    const seedButton = buttons.find(btn =>
      btn.textContent?.includes('Seed Sample Data')
    );

    if (!seedButton) return false;

    const style = window.getComputedStyle(seedButton);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }
});

dashboardUIValidator.addRule({
  name: 'Dashboard Navigation Link',
  description: 'Sidebar must have Executive Dashboard navigation item',
  severity: 'critical',
  check: () => {
    if (typeof document === 'undefined') return true;

    const body = document.body.textContent || '';
    return body.includes('Executive Dashboard');
  }
});

dashboardUIValidator.addRule({
  name: 'FR2052a Navigation Link',
  description: 'Sidebar must have FR 2052a Report navigation item',
  severity: 'critical',
  check: () => {
    if (typeof document === 'undefined') return true;

    const body = document.body.textContent || '';
    return body.includes('FR 2052a') || body.includes('FR2052a');
  }
});

export function validateDashboardUI(): Promise<UIValidationResult[]> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve([]);
      return;
    }

    setTimeout(() => {
      const results = dashboardUIValidator.validate();
      console.log(dashboardUIValidator.getReport());
      resolve(results);
    }, 1000);
  });
}

export function checkCriticalUIIssues(): Promise<boolean> {
  return new Promise((resolve) => {
    validateDashboardUI().then(results => {
      const hasCritical = results.some(
        r => !r.passed && r.rule.severity === 'critical'
      );
      resolve(hasCritical);
    });
  });
}
