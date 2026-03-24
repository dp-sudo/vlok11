# immersa-3d-scene-viewer - Onboarding Guide

## Project Overview

Welcome! This guide will help you get started with immersa-3d-scene-viewer.

## Tech Stack

| Technology | Version |
|------------|---------|
|  | google/genai |
|  | mediapipe/face_detection |
|  | react-three/drei |
|  | react-three/fiber |
|  | sentry/react |
|  | tensorflow-models/depth-estimation |
|  | tensorflow-models/face-detection |
|  | tensorflow/tfjs |
| hls.js | latest |
| lucide-react | latest |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `dev` | vite |
| `build` | tsc --noEmit && vite build |
| `preview` | vite preview |
| `lint` | eslint src --max-warnings 0 |
| `lint:fix` | eslint src --fix |
| `lint:strict` | eslint src --max-warnings 0 && tsc --noEmit |
| `verify` | npm run lint:strict && vite build |
| `format` | prettier --write . |
| `format:check` | prettier --check . |
| `biome:check` | biome check src |
| `biome:fix` | biome check --write src |
| `biome:organize` | biome organize src |
| `biome:lint` | biome lint src |
| `biome:format` | biome format src |
| `clean` | rimraf dist node_modules/.vite |
| `deps:update` | npm update |
| `deploy` | npm run build && wrangler pages deploy dist --project-name=immersa-3d |
| `deploy:preview` | npm run build && wrangler pages deploy dist --project-name=immersa-3d --branch=preview |
| `setup:domain` | bash ./setup-domain.sh |
| `setup:env` | bash ./setup-env.sh |
| `full-deploy` | npm run build && wrangler pages deploy dist --project-name=immersa-3d && echo '部署成功！访问: https://immersa-3d.pages.dev' |
| `test` | vitest |
| `test:run` | vitest run |
| `test:coverage` | vitest run --coverage |
| `test:e2e` | playwright test |
| `code-health` | node .code-health/cli.js |
| `code-health:debt` | node .code-health/cli.js debt |
| `code-health:report` | node .code-health/cli.js report |
| `typecheck:strict` | tsc -p .code-health/tsconfig.strict.json --noEmit |
| `docs:api` | npx typedoc --options .code-health/config/typedoc.json |
| `docs:architecture` | node .code-health/cli.js docs architecture -o ./docs/architecture |
| `docs:onboarding` | node .code-health/cli.js docs onboarding -o ./docs/ONBOARDING.md |
| `docs:all` | npm run docs:api && npm run docs:architecture && npm run docs:onboarding |

## Project Structure

```
src/
├── core/           # Core modules (EventBus, Logger, etc.)
├── features/       # Feature modules
│   ├── ai/         # AI services
│   ├── scene/      # 3D scene rendering
│   └── render/     # Rendering components
└── shared/         # Shared utilities
```

## Key Modules

### App

Location: `src/app/`

TODO: Add module description

### Core

Location: `src/core/`

TODO: Add module description

### Features

Location: `src/features/`

TODO: Add module description

### Shared

Location: `src/shared/`

TODO: Add module description

### Stores

Location: `src/stores/`

TODO: Add module description

### Tests

Location: `src/tests/`

TODO: Add module description

### Types

Location: `src/types/`

TODO: Add module description

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Submit a pull request

## Resources

- [Project Documentation](./docs/)
- [API Documentation](./docs/api/)
- [Architecture Diagrams](./docs/architecture/)

---

Last updated: 2026-03-24
