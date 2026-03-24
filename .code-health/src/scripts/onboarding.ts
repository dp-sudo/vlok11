// .code-health/src/scripts/onboarding.ts
import { writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

interface OnboardingData {
  projectName: string;
  techStack: string[];
  scripts: Record<string, string>;
  modules: string[];
}

export function generateOnboarding(outputPath: string): void {
  const data = collectProjectData();
  const markdown = generateMarkdown(data);
  writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`Onboarding guide written to ${outputPath}`);
}

function collectProjectData(): OnboardingData {
  // Read package.json for tech stack and scripts
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

  // Get list of modules
  let modules: string[] = [];
  try {
    const output = execSync('ls -d src/*/', { encoding: 'utf-8' });
    modules = output.split('\n').filter(Boolean).map((m: string) => m.replace('src/', '').replace('/', ''));
  } catch {
    modules = ['core', 'features', 'shared'];
  }

  return {
    projectName: packageJson.name || 'IMMERSA 3D Scene Viewer',
    techStack: Object.keys(packageJson.dependencies || {}),
    scripts: packageJson.scripts || {},
    modules
  };
}

function generateMarkdown(data: OnboardingData): string {
  return `# ${data.projectName} - Onboarding Guide

## Project Overview

Welcome! This guide will help you get started with ${data.projectName}.

## Tech Stack

| Technology | Version |
|------------|---------|
${data.techStack.slice(0, 10).map((dep: string) => {
  const [name, version] = dep.split('@');
  return `| ${name} | ${version || 'latest'} |`;
}).join('\n')}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
\`\`\`

## Available Scripts

| Command | Description |
|---------|-------------|
${Object.entries(data.scripts).map(([name, desc]: [string, string]) => `| \`${name}\` | ${desc} |`).join('\n')}

## Project Structure

\`\`\`
src/
├── core/           # Core modules (EventBus, Logger, etc.)
├── features/       # Feature modules
│   ├── ai/         # AI services
│   ├── scene/      # 3D scene rendering
│   └── render/     # Rendering components
└── shared/         # Shared utilities
\`\`\`

## Key Modules

${data.modules.map((m: string) => `### ${m.charAt(0).toUpperCase() + m.slice(1)}

Location: \`src/${m}/\`

TODO: Add module description`).join('\n\n')}

## Development Workflow

1. Create a feature branch: \`git checkout -b feature/your-feature\`
2. Make your changes
3. Run tests: \`npm test\`
4. Run linting: \`npm run lint\`
5. Submit a pull request

## Resources

- [Project Documentation](./docs/)
- [API Documentation](./docs/api/)
- [Architecture Diagrams](./docs/architecture/)

---

Last updated: ${new Date().toISOString().split('T')[0]}
`;
}
