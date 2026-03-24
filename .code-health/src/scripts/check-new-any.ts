import { execSync } from 'child_process';

export interface NewAnyFinding {
  file: string;
  line: number;
  column: number;
  code: string;
  isNew: boolean;
}

/**
 * Check for explicit 'any' usage and determine if it's new (not in main branch)
 */
export function checkNewAny(): NewAnyFinding[] {
  const findings: NewAnyFinding[] = [];

  try {
    // Get list of changed files in this PR
    const changedFiles = execSync(
      'git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1...HEAD 2>/dev/null || echo ""',
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    if (changedFiles.length === 0) {
      // No main branch, fall back to grep all
      const output = execSync(
        'grep -rn ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true',
        { encoding: 'utf-8' }
      );
      return parseFindings(output);
    }

    // Search only in changed files
    for (const file of changedFiles) {
      if (!file.startsWith('src/') || file.includes('node_modules')) continue;

      try {
        const output = execSync(
          `grep -n ": any" "${file}" 2>/dev/null || true`,
          { encoding: 'utf-8' }
        );
        const lines = output.split('\n').filter(Boolean);
        for (const line of lines) {
          const match = line.match(/^(\d+):(\d+):\s*(.*)$/);
          if (match) {
            findings.push({
              file,
              line: parseInt(match[1]),
              column: parseInt(match[2]),
              code: match[3].trim(),
              isNew: true,
            });
          }
        }
      } catch {
        // File might not exist or have matches
      }
    }
  } catch {
    // Fall back to checking all files
    const output = execSync(
      'grep -rn ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true',
      { encoding: 'utf-8' }
    );
    return parseFindings(output);
  }

  return findings;
}

function parseFindings(output: string): NewAnyFinding[] {
  const findings: NewAnyFinding[] = [];
  const lines = output.split('\n').filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^(.+):(\d+):(\d+):\s*(.*)$/);
    if (match) {
      findings.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4].trim(),
        isNew: true,
      });
    }
  }
  return findings;
}
