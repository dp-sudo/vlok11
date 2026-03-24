# ADR-0002: Use TypeScript Strict Mode

## Status

✅ Accepted

## Context

The codebase currently uses TypeScript without strict mode enabled. This leads to:
- Implicit `any` types being allowed
- Null/undefined errors not being caught at compile time
- Poor type inference in many places

## Decision

Enable TypeScript strict mode with the following options:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `strictBindCallApply: true`
- `strictPropertyInitialization: true`
- `noImplicitThis: true`
- `alwaysStrict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`

## Consequences

### Positive
- Catches type errors at compile time instead of runtime
- Forces explicit type declarations improving code readability
- Enables better IDE support and IntelliSense

### Negative/Risks
- Requires fixing existing type violations
- May slow down initial development slightly
- Some existing code will need refactoring

### Related Debts
- TD-2026-002: EventBus allows type erasure (partially addressed)

## Review Record
- 2026-03-25 - Initial acceptance
