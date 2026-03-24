// .code-health/src/scripts/module-graph.ts
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

interface ModuleInfo {
  name: string;
  path: string;
  imports: string[];
}

export function generateModuleGraph(outputDir: string): void {
  // Find all TypeScript files
  const files = execSync('find src -name "*.ts" -o -name "*.tsx" | grep -v node_modules', {
    encoding: 'utf-8'
  }).split('\n').filter(Boolean);

  const modules: ModuleInfo[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const imports = parseImports(content);
      const name = file.replace('src/', '').replace(/\.(ts|tsx)$/, '');
      modules.push({ name, path: file, imports });
    } catch {
      // Skip files that can't be read
    }
  }

  // Generate Mermaid diagram
  const mermaid = generateMermaidGraph(modules);

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  writeFileSync(path.join(outputDir, 'module-dependencies.mmd'), mermaid, 'utf-8');
  console.log(`Module graph written to ${outputDir}/module-dependencies.mmd`);
}

function parseImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    if (!match[1].startsWith('.') && !match[1].startsWith('@')) {
      imports.push(match[1]);
    }
  }
  return imports;
}

function generateMermaidGraph(modules: ModuleInfo[]): string {
  const lines = ['```mermaid', 'graph TD'];

  // Group modules by top-level directory
  const groups: Record<string, ModuleInfo[]> = {};
  for (const mod of modules) {
    const parts = mod.path.split('/');
    const group = parts[1] || 'root';
    if (!groups[group]) groups[group] = [];
    groups[group].push(mod);
  }

  // Generate nodes
  for (const [group, mods] of Object.entries(groups)) {
    for (const mod of mods) {
      const nodeId = mod.name.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`    ${nodeId}["${mod.name}"]`);
    }
  }

  // Generate dependencies
  for (const mod of modules) {
    const sourceId = mod.name.replace(/[^a-zA-Z0-9]/g, '_');
    for (const imp of mod.imports) {
      const targetName = imp.replace(/^@?\/?/, '').replace(/\.(ts|tsx)$/, '');
      const targetId = targetName.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`    ${sourceId} --> ${targetId}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}
