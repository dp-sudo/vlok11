// .code-health/src/scripts/check-explicit-any.ts
import { execSync } from 'child_process';

export interface AnyFinding {
  file: string;
  line: number;
  column: number;
  code: string;
}

export function checkExplicitAny(): AnyFinding[] {
  const findings: AnyFinding[] = [];
  try {
    const output = execSync(
      'grep -rn ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true',
      { encoding: 'utf-8' }
    );
    const lines = output.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^(.+):(\d+):(\d+):\s*(.*)$/);
      if (match) {
        findings.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4].trim(),
        });
      }
    }
  } catch {
    // grep returns non-zero when no matches
  }
  return findings;
}