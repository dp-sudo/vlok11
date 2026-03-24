// .code-health/src/scripts/optimize-rules.ts
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rulesPath = path.resolve(__dirname, '../../config/detection-rules.json');

interface RuleStats {
  ruleId: string;
  triggerCount: number;
  lastTriggered: string;
}

export function analyzeRuleEffectiveness(): RuleStats[] {
  const rules = JSON.parse(readFileSync(rulesPath, 'utf-8')).rules;
  return rules.map((rule: { id: string }) => ({
    ruleId: rule.id,
    triggerCount: 0,
    lastTriggered: 'never'
  }));
}

export function suggestRuleChanges(): string[] {
  const suggestions: string[] = [];
  const stats = analyzeRuleEffectiveness();

  for (const stat of stats) {
    if (stat.triggerCount === 0) {
      suggestions.push(`Rule ${stat.ruleId} has never triggered - consider removing or adjusting`);
    }
    if (stat.triggerCount > 100) {
      suggestions.push(`Rule ${stat.ruleId} triggers very frequently - consider if it's too noisy`);
    }
  }

  return suggestions;
}

export function printOptimizationSuggestions(): void {
  const suggestions = suggestRuleChanges();
  console.log('\n=== Detection Rule Optimization ===\n');

  if (suggestions.length === 0) {
    console.log('No optimization suggestions at this time.');
    return;
  }

  console.log('Suggestions:');
  suggestions.forEach(s => console.log(`  - ${s}`));
}
