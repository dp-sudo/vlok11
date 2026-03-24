// .code-health/src/scripts/run-detections.ts
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../../config/detection-rules.json');

interface DetectionRule {
  id: string;
  pattern?: string;
  tool?: string;
  threshold?: number;
  severity: string;
  category: string;
  autoRegister: boolean;
  dryRun: boolean;
  description: string;
}

interface DetectionResult {
  ruleId: string;
  file: string;
  line?: number;
  column?: number;
  code: string;
}

export async function runDetections(): Promise<DetectionResult[]> {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const results: DetectionResult[] = [];

  for (const rule of config.rules as DetectionRule[]) {
    if (rule.pattern) {
      try {
        const cmd = `grep -rn "${rule.pattern}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        const lines = output.split('\n').filter(Boolean);
        for (const line of lines) {
          const match = line.match(/^(.+):(\d+):(\d+):(.*)$/);
          if (match) {
            results.push({
              ruleId: rule.id,
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
    }
  }
  return results;
}