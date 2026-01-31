import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import {
  DOUBLE_TAP_THRESHOLD,
  LONG_PRESS_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD,
} from '@/shared/constants';
import { clientPointToElementPoint } from '@/shared/utils';

import type { LifecycleAware } from '@/core/LifecycleManager';
import type {
  GestureEvent,
  InputSensitivity,
  InputService as InputServiceType,
  InteractionState,
  InteractionType,
  Point2D,
} from '@/shared/types';

type EndCallback = () => void;
type GestureCallback = (gesture: GestureEvent) => void;
type InteractionCallback = (type: InteractionType) => void;

const DEFAULT_SENSITIVITY: InputSensitivity = { rotate: 1.0, pan: 1.0, zoom: 1.0, pinch: 1.0 };

export const getInputService = (): InputServiceType => InputServiceImpl.getInstance();
const INPUT_CONSTANTS = {
  ZOOM_SENSITIVITY_FACTOR: 0.001,
  WHEEL_END_DELAY_MS: 140,
  VELOCITY_HISTORY_MAX: 5,
  MS_PER_SECOND: 1000,
} as const;
const logger = createLogger({ module: 'InputService' });

class InputServiceImpl implements InputServiceType, LifecycleAware {
  private static instance: InputServiceImpl | null = null;
  readonly dependencies: string[] = [];
  private element: HTMLElement | null = null;
  private enabled = true;
  private endCallbacks: EndCallback[] = [];
  private gestureCallbacks: GestureCallback[] = [];

  private lastTapTime = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private sensitivity: InputSensitivity = { ...DEFAULT_SENSITIVITY };
  readonly serviceId = 'InputService';
  private startCallbacks: InteractionCallback[] = [];
  private state: InteractionState = {
    isInteracting: false,
    type: 'none',
    startPosition: null,
    currentPosition: null,
    startTime: 0,
    lastUpdateTime: 0,
  };
  private touchStartDistance = 0;
  private velocityHistory: { position: Point2D; time: number }[] = [];
  private wheelEndTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  static getInstance(): InputServiceImpl {
    InputServiceImpl.instance ??= new InputServiceImpl();

    return InputServiceImpl.instance;
  }

  static resetInstance(): void {
    if (InputServiceImpl.instance) {
      InputServiceImpl.instance.unbind();
    }
    InputServiceImpl.instance = null;
  }

  bindToElement(element: HTMLElement): void {
    this.unbind();
    this.element = element;

    element.addEventListener('mousedown', this.handleMouseDown);
    element.addEventListener('contextmenu', this.handleContextMenu);
    element.addEventListener('wheel', this.handleWheel, { passive: false });
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd);

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
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

  async destroy(): Promise<void> {
    this.unbind();
    logger.info('Destroyed');
  }

  private emitGesture(gesture: GestureEvent): void {
    this.gestureCallbacks.forEach((cb) => {
      cb(gesture);
    });
    getEventBus().emit('input:gesture', { gesture });
  }

  private endInteraction(): void {
    const duration = Date.now() - this.state.startTime;
    const { type } = this.state;

    this.state = {
      isInteracting: false,
      type: 'none',
      startPosition: null,
      currentPosition: null,
      startTime: 0,
      lastUpdateTime: Date.now(),
    };

    this.endCallbacks.forEach((cb) => {
      cb();
    });
    getEventBus().emit('input:interaction-end', { type, duration });
  }

  getInteractionType(): InteractionType {
    return this.state.type;
  }

  private getMousePosition(e: MouseEvent): Point2D {
    const client = { x: e.clientX, y: e.clientY };

    if (this.element) {
      return clientPointToElementPoint(client, this.element);
    }

    return client;
  }

  getSensitivity(): InputSensitivity {
    return { ...this.sensitivity };
  }

  getState(): InteractionState {
    return { ...this.state };
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
    if (!this.enabled || !this.state.isInteracting) {
      return;
    }
    const position = this.getMousePosition(e);

    this.updateInteraction(position);
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.state.isInteracting) {
      return;
    }
    this.endInteraction();
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.clearLongPressTimer();

    if (e.touches.length === 0) {
      const velocity = this.calculateVelocity();

      if (velocity && Math.hypot(velocity.x, velocity.y) > SWIPE_VELOCITY_THRESHOLD) {
        this.emitGesture({
          type: 'swipe',
          position: this.state.currentPosition ?? { x: 0, y: 0 },
          velocity,
          timestamp: Date.now(),
        });
      }
      this.endInteraction();
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.enabled || !this.state.isInteracting) {
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

    if (!this.state.isInteracting) {
      this.startInteraction('pinch', position);
    } else if (this.state.type === 'pinch') {
      this.updateInteraction(position);
    }

    const delta = e.deltaY * this.sensitivity.zoom * INPUT_CONSTANTS.ZOOM_SENSITIVITY_FACTOR;

    this.emitGesture({ type: 'pinch', position, scale: 1 - delta, timestamp: Date.now() });

    if (this.wheelEndTimer) {
      clearTimeout(this.wheelEndTimer);
    }
    this.wheelEndTimer = setTimeout(() => {
      if (this.state.isInteracting && this.state.type === 'pinch') {
        this.endInteraction();
      }
    }, INPUT_CONSTANTS.WHEEL_END_DELAY_MS);
  }

  async initialize(): Promise<void> {
    logger.info('Initialized');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isInteracting(): boolean {
    return this.state.isInteracting;
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

  onInteractionEnd(callback: EndCallback): () => void {
    this.endCallbacks.push(callback);

    return () => {
      const idx = this.endCallbacks.indexOf(callback);

      if (idx !== -1) {
        this.endCallbacks.splice(idx, 1);
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

  pause(): void {
    this.setEnabled(false);
  }

  resume(): void {
    this.setEnabled(true);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    getEventBus().emit('input:enabled-changed', { enabled });
  }

  setSensitivity(sensitivity: Partial<InputSensitivity>): void {
    this.sensitivity = { ...this.sensitivity, ...sensitivity };
  }

  private startInteraction(type: InteractionType, position: Point2D): void {
    const now = Date.now();

    this.state = {
      isInteracting: true,
      type,
      startPosition: position,
      currentPosition: position,
      startTime: now,
      lastUpdateTime: now,
    };
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

  unbind(): void {
    if (!this.element) {
      return;
    }

    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);

    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

    this.clearLongPressTimer();
    if (this.wheelEndTimer) {
      clearTimeout(this.wheelEndTimer);
      this.wheelEndTimer = null;
    }
    this.element = null;
  }

  private updateInteraction(position: Point2D): void {
    if (!this.state.isInteracting || !this.state.currentPosition) {
      return;
    }

    const now = Date.now();
    const delta = {
      x: position.x - this.state.currentPosition.x,
      y: position.y - this.state.currentPosition.y,
    };

    this.state.currentPosition = position;
    this.state.lastUpdateTime = now;

    this.velocityHistory.push({ position, time: now });
    if (this.velocityHistory.length > INPUT_CONSTANTS.VELOCITY_HISTORY_MAX) {
      this.velocityHistory.shift();
    }

    getEventBus().emit('input:interaction-update', { type: this.state.type, position, delta });
  }
}

export { InputServiceImpl as InputService };
