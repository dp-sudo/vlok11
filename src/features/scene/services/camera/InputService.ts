import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import type {
  GestureEvent,
  InputSensitivity,
  InputService as InputServiceType,
  InteractionState,
  InteractionType,
} from '@/shared/types';
import { InputHandler } from './InputHandler';
import { InputStateManager } from './InputState';

const logger = createLogger({ module: 'InputService' });

export const getInputService = (): InputServiceType => InputServiceImpl.getInstance();

class InputServiceImpl implements InputServiceType, LifecycleAware {
  private static instance: InputServiceImpl | null = null;
  readonly dependencies: string[] = [];
  readonly serviceId = 'InputService';

  private stateManager: InputStateManager;
  private inputHandler: InputHandler;

  private constructor() {
    this.stateManager = new InputStateManager();
    this.inputHandler = new InputHandler(this.stateManager);
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
    this.inputHandler.bindToElement(element);
  }

  async destroy(): Promise<void> {
    this.unbind();
    logger.info('Destroyed');
  }

  getInteractionType(): InteractionType {
    return this.stateManager.getInteractionType();
  }

  getSensitivity(): InputSensitivity {
    return this.inputHandler.getSensitivity();
  }

  getState(): InteractionState {
    return this.stateManager.getState();
  }

  async initialize(): Promise<void> {
    logger.info('Initialized');
  }

  isEnabled(): boolean {
    return this.inputHandler.isEnabled();
  }

  isInteracting(): boolean {
    return this.stateManager.isInteracting();
  }

  onGesture(callback: (gesture: GestureEvent) => void): () => void {
    return this.inputHandler.onGesture(callback);
  }

  onInteractionEnd(callback: () => void): () => void {
    return this.inputHandler.onInteractionEnd(callback);
  }

  onInteractionStart(callback: (type: InteractionType) => void): () => void {
    return this.inputHandler.onInteractionStart(callback);
  }

  pause(): void {
    this.setEnabled(false);
  }

  resume(): void {
    this.setEnabled(true);
  }

  setEnabled(enabled: boolean): void {
    this.inputHandler.setEnabled(enabled);
  }

  setSensitivity(sensitivity: Partial<InputSensitivity>): void {
    this.inputHandler.setSensitivity(sensitivity);
  }

  unbind(): void {
    this.inputHandler.unbind();
  }
}

export { InputServiceImpl as InputService };
