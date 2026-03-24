# ADR-0003: Event System Typed

## Status

🔄 Proposed

## Context

The current EventBus implementation uses `any` for event payloads, losing type safety. This makes it easy to:
- Send events with incorrect payload types
- Receive events without type checking
- Debug event flows difficult due to隐式类型

## Decision

Refactor EventBus to use TypeScript generics and event schemas:

```typescript
// Event type definitions
interface EventMap {
  'scene:load': { sceneId: string; timestamp: number };
  'scene:error': { error: Error; context: Record<string, unknown> };
  'user:action': { action: string; metadata?: Record<string, unknown> };
}

// Typed emit and on methods
emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): void;
```

## Consequences

### Positive
- Full compile-time type checking for events
- IDE auto-complete for event names and payloads
- Easier debugging with explicit types

### Negative/Risks
- Requires updating all event usage sites
- May need migration strategy for existing code
- Event schema maintenance overhead

### Related Debts
- TD-2026-001: EventBus allows type erasure

## Review Record
- 2026-03-25 - Proposed, pending implementation
