const fs = require('fs');

const data = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));

const logicErrors = [];

const ignoredRules = [
  'padding-line-between-statements',
  'no-multiple-empty-lines',
  'quotes',
  'semi',
  'indent',
  'space-before-function-paren',
  '@typescript-eslint/semi',
  '@typescript-eslint/quotes',
  '@typescript-eslint/indent',
  '@typescript-eslint/member-delimiter-style',
  '@typescript-eslint/type-annotation-spacing',
  'comma-dangle',
  'arrow-parens',
  'object-curly-spacing',
  'keyword-spacing',
  'space-infix-ops',
  '@typescript-eslint/no-unnecessary-type-assertion',
  '@typescript-eslint/consistent-type-exports',
  '@typescript-eslint/consistent-type-imports'
];

data.forEach(file => {
  if (file.messages && file.messages.length > 0) {
    const relevantMessages = file.messages.filter(msg => !ignoredRules.includes(msg.ruleId));
    if (relevantMessages.length > 0) {
      logicErrors.push({
        filePath: file.filePath,
        messages: relevantMessages.map(m => `[${m.severity === 2 ? 'ERROR' : 'WARN'}] ${m.ruleId}: ${m.message} (Line ${m.line})`)
      });
    }
  }
});

console.log(JSON.stringify(logicErrors, null, 2));
