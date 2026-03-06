import type { InteractionState, InteractionType, Point2D } from '@/shared/types';

export const DEFAULT_INTERACTION_STATE: InteractionState = {
  isInteracting: false,
  type: 'none',
  startPosition: null,
  currentPosition: null,
  startTime: 0,
  lastUpdateTime: 0,
};

export class InputStateManager {
  private state: InteractionState = { ...DEFAULT_INTERACTION_STATE };

  getState(): InteractionState {
    return { ...this.state };
  }

  getInteractionType(): InteractionType {
    return this.state.type;
  }

  isInteracting(): boolean {
    return this.state.isInteracting;
  }

  startInteraction(type: InteractionType, position: Point2D): void {
    const now = Date.now();

    this.state = {
      isInteracting: true,
      type,
      startPosition: position,
      currentPosition: position,
      startTime: now,
      lastUpdateTime: now,
    };
  }

  updateInteraction(position: Point2D): void {
    if (!this.state.isInteracting || !this.state.currentPosition) {
      return;
    }

    const now = Date.now();

    this.state = {
      ...this.state,
      currentPosition: position,
      lastUpdateTime: now,
    };
  }

  endInteraction(): void {
    this.state = {
      isInteracting: false,
      type: 'none',
      startPosition: null,
      currentPosition: null,
      startTime: 0,
      lastUpdateTime: Date.now(),
    };
  }

  reset(): void {
    this.state = { ...DEFAULT_INTERACTION_STATE };
  }
}
