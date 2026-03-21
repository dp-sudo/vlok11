import { getEventBus } from '@/core/EventBus';
import {
  DOUBLE_TAP_THRESHOLD,
  LONG_PRESS_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD,
} from '@/shared/constants';
import type { GestureEvent, InputSensitivity, InteractionType, Point2D } from '@/shared/types';
import { clientPointToElementPoint } from '@/shared/utils';

import type { InputStateManager } from './InputState';

type EndCallback = () => void;
type GestureCallback = (gesture: GestureEvent) => void;
type InteractionCallback = (type: InteractionType) => void;

const DEFAULT_SENSITIVITY: InputSensitivity = { rotate: 1.0, pan: 1.0, zoom: 1.0, pinch: 1.0 };

const INPUT_CONSTANTS = {
  ZOOM_SENSITIVITY_FACTOR: 0.001,
  WHEEL_END_DELAY_MS: 140,
  VELOCITY_HISTORY_MAX: 5,
  MS_PER_SECOND: 1000,
} as const;

export class InputHandler {
  private element: HTMLElement | null = null;
  private stateManager: InputStateManager;
  private sensitivity: InputSensitivity = { ...DEFAULT_SENSITIVITY };

  private lastTapTime = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private touchStartDistance = 0;
  private velocityHistory: { position: Point2D; time: number }[] = [];
  private wheelEndTimer: ReturnType<typeof setTimeout> | null = null;

  private endCallbacks: EndCallback[] = [];
  private gestureCallbacks: GestureCallback[] = [];
  private startCallbacks: InteractionCallback[] = [];

  private enabled = true;

  // Bound event handlers
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleWheel: (e: WheelEvent) => void;
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private boundHandleContextMenu: (e: MouseEvent) => void;

  constructor(stateManager: InputStateManager) {
    this.stateManager = stateManager;

    // Bind all event handlers
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleWheel = this.handleWheel.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleContextMenu = this.handleContextMenu.bind(this);
  }

  bindToElement(element: HTMLElement): void {
    this.unbind();
    this.element = element;

    element.addEventListener('mousedown', this.boundHandleMouseDown);
    element.addEventListener('contextmenu', this.boundHandleContextMenu);
    element.addEventListener('wheel', this.boundHandleWheel, { passive: false });
    element.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    element.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    element.addEventListener('touchend', this.boundHandleTouchEnd);

    window.addEventListener('mousemove', this.boundHandleMouseMove);
    window.addEventListener('mouseup', this.boundHandleMouseUp);
  }

  unbind(): void {
    if (!this.element) {
      return;
    }

    this.element.removeEventListener('mousedown', this.boundHandleMouseDown);
    this.element.removeEventListener('contextmenu', this.boundHandleContextMenu);
    this.element.removeEventListener('wheel', this.boundHandleWheel);
    this.element.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.element.removeEventListener('touchmove', this.boundHandleTouchMove);
    this.element.removeEventListener('touchend', this.boundHandleTouchEnd);

    window.removeEventListener('mousemove', this.boundHandleMouseMove);
    window.removeEventListener('mouseup', this.boundHandleMouseUp);

    this.clearLongPressTimer();
    if (this.wheelEndTimer) {
      clearTimeout(this.wheelEndTimer);
      this.wheelEndTimer = null;
    }
    this.element = null;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    getEventBus().emit('input:enabled-changed', { enabled });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setSensitivity(sensitivity: Partial<InputSensitivity>): void {
    this.sensitivity = { ...this.sensitivity, ...sensitivity };
  }

  getSensitivity(): InputSensitivity {
    return { ...this.sensitivity };
  }

  onGesture(callback: GestureCallback): () => void {
    this.gestureCallbacks.push(callback);

    return () => {
      const idx = this.gestureCallbacks.indexOf(callback);

      if (idx !== -1) {
        this.gestureCallbacks.splice(idx, 1);
      }
    };
  }

  onInteractionStart(callback: InteractionCallback): () => void {
    this.startCallbacks.push(callback);

    return () => {
      const idx = this.startCallbacks.indexOf(callback);

      if (idx !== -1) {
        this.startCallbacks.splice(idx, 1);
      }
    };
  }

  onInteractionEnd(callback: EndCallback): () => void {
    this.endCallbacks.push(callback);

    return () => {
      const idx = this.endCallbacks.indexOf(callback);

      if (idx !== -1) {
        this.endCallbacks.splice(idx, 1);
      }
    };
  }

  private calculateVelocity(): Point2D | null {
    if (this.velocityHistory.length < 2) {
      return null;
    }
    const first = this.velocityHistory[0];
    const last = this.velocityHistory[this.velocityHistory.length - 1];

    if (!first || !last) {
      return null;
    }
    const dt = (last.time - first.time) / INPUT_CONSTANTS.MS_PER_SECOND;

    if (dt === 0) {
      return null;
    }

    return {
      x: (last.position.x - first.position.x) / dt,
      y: (last.position.y - first.position.y) / dt,
    };
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private emitGesture(gesture: GestureEvent): void {
    this.gestureCallbacks.forEach((cb) => {
      cb(gesture);
    });
    getEventBus().emit('input:gesture', { gesture });
  }

  private getMousePosition(e: MouseEvent): Point2D {
    const client = { x: e.clientX, y: e.clientY };

    if (this.element) {
      return clientPointToElementPoint(client, this.element);
    }

    return client;
  }

  private getTouchDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;

    return Math.hypot(dx, dy);
  }

  private getTouchPosition(touch: Touch): Point2D {
    const client = { x: touch.clientX, y: touch.clientY };

    if (this.element) {
      return clientPointToElementPoint(client, this.element);
    }

    return client;
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.enabled) {
      return;
    }
    const position = this.getMousePosition(e);
    let type: InteractionType = 'rotate';

    if (e.button === 2 || e.button === 1) {
      type = 'pan';
    }
    this.startInteraction(type, position);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.stateManager.isInteracting()) {
      return;
    }
    const position = this.getMousePosition(e);

    this.updateInteraction(position);
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.stateManager.isInteracting()) {
      return;
    }
    this.endInteraction();
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.clearLongPressTimer();

    if (e.touches.length === 0) {
      const velocity = this.calculateVelocity();
      const state = this.stateManager.getState();

      if (velocity && Math.hypot(velocity.x, velocity.y) > SWIPE_VELOCITY_THRESHOLD) {
        this.emitGesture({
          type: 'swipe',
          position: state.currentPosition ?? { x: 0, y: 0 },
          velocity,
          timestamp: Date.now(),
        });
      }
      this.endInteraction();
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.enabled || !this.stateManager.isInteracting()) {
      return;
    }
    e.preventDefault();

    const { touches } = e;

    this.clearLongPressTimer();

    if (touches.length === 1) {
      const firstTouch = touches[0];

      if (!firstTouch) {
        return;
      }
      const position = this.getTouchPosition(firstTouch);

      this.updateInteraction(position);
    } else if (touches.length === 2) {
      const firstTouch = touches[0];
      const secondTouch = touches[1];

      if (!firstTouch || !secondTouch) {
        return;
      }
      const position = this.getTouchPosition(firstTouch);
      const currentDistance = this.getTouchDistance(firstTouch, secondTouch);
      const scale = currentDistance / this.touchStartDistance;

      this.emitGesture({
        type: 'pinch',
        position,
        scale: scale * this.sensitivity.pinch,
        timestamp: Date.now(),
      });
      this.touchStartDistance = currentDistance;
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    if (!this.enabled) {
      return;
    }
    e.preventDefault();

    const { touches } = e;
    const firstTouch = touches[0];

    if (!firstTouch) {
      return;
    }

    const position = this.getTouchPosition(firstTouch);

    if (touches.length === 1) {
      this.startInteraction('touch', position);
      this.startLongPressTimer(position);

      const now = Date.now();

      if (now - this.lastTapTime < DOUBLE_TAP_THRESHOLD) {
        this.emitGesture({ type: 'double-tap', position, timestamp: now });
      }
      this.lastTapTime = now;
    } else if (touches.length === 2) {
      const secondTouch = touches[1];

      if (!secondTouch) {
        return;
      }
      this.clearLongPressTimer();
      this.touchStartDistance = this.getTouchDistance(firstTouch, secondTouch);
      this.startInteraction('pinch', position);
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (!this.enabled) {
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    if (e.cancelable) {
      e.preventDefault();
    }
    const position = this.getMousePosition(e);

    if (!this.stateManager.isInteracting()) {
      this.startInteraction('pinch', position);
    } else if (this.stateManager.getInteractionType() === 'pinch') {
      this.updateInteraction(position);
    }

    const delta = e.deltaY * this.sensitivity.zoom * INPUT_CONSTANTS.ZOOM_SENSITIVITY_FACTOR;

    this.emitGesture({ type: 'pinch', position, scale: 1 - delta, timestamp: Date.now() });

    if (this.wheelEndTimer) {
      clearTimeout(this.wheelEndTimer);
    }
    this.wheelEndTimer = setTimeout(() => {
      if (this.stateManager.isInteracting() && this.stateManager.getInteractionType() === 'pinch') {
        this.endInteraction();
      }
    }, INPUT_CONSTANTS.WHEEL_END_DELAY_MS);
  }

  private startInteraction(type: InteractionType, position: Point2D): void {
    const now = Date.now();

    this.stateManager.startInteraction(type, position);
    this.velocityHistory = [{ position, time: now }];
    this.startCallbacks.forEach((cb) => {
      cb(type);
    });
    getEventBus().emit('input:interaction-start', { type, position, timestamp: now });
  }

  private startLongPressTimer(position: Point2D): void {
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.emitGesture({ type: 'long-press', position, timestamp: Date.now() });
    }, LONG_PRESS_THRESHOLD);
  }

  private updateInteraction(position: Point2D): void {
    if (!this.stateManager.isInteracting()) {
      return;
    }

    const state = this.stateManager.getState();

    if (!state.currentPosition) {
      return;
    }

    const delta = {
      x: position.x - state.currentPosition.x,
      y: position.y - state.currentPosition.y,
    };

    this.stateManager.updateInteraction(position);

    const now = Date.now();

    this.velocityHistory.push({ position, time: now });
    if (this.velocityHistory.length > INPUT_CONSTANTS.VELOCITY_HISTORY_MAX) {
      this.velocityHistory.shift();
    }

    getEventBus().emit('input:interaction-update', { type: state.type, position, delta });
  }

  private endInteraction(): void {
    const state = this.stateManager.getState();
    const duration = Date.now() - state.startTime;
    const { type } = state;

    this.stateManager.endInteraction();

    this.endCallbacks.forEach((cb) => {
      cb();
    });
    getEventBus().emit('input:interaction-end', { type, duration });
  }
}
