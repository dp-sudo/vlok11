import type { AIProvider } from './types';

export type LazyProvider = AIProvider & { initialize(): Promise<void> };

type ProviderGetter = () => Promise<LazyProvider>;

export class AIServiceProviderManager {
  private providers: Map<string, { instance: LazyProvider | null; getter: ProviderGetter }> =
    new Map();

  register(name: string, getter: ProviderGetter): void {
    this.providers.set(name, { instance: null, getter });
  }

  async getProvider(name: string): Promise<LazyProvider> {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(`Provider ${name} not registered`);
    }

    provider.instance ??= await provider.getter();

    return provider.instance;
  }

  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  isProviderReady(name: string): boolean {
    const provider = this.providers.get(name);

    return provider?.instance !== null && provider?.instance !== undefined;
  }

  async dispose(): Promise<void> {
    const disposePromises = Array.from(this.providers.values())
      .filter((p) => p.instance)
      .map((p) => p.instance!.dispose());

    await Promise.all(disposePromises);

    this.providers.forEach((p) => {
      p.instance = null;
    });
  }
}

// Lazy load heavy AI providers to reduce initial bundle size
let tensorflowProvider: LazyProvider | null = null;
let geminiProvider: LazyProvider | null = null;

export async function getTensorFlowProvider(): Promise<LazyProvider> {
  if (!tensorflowProvider) {
    const { TensorFlowProvider } = await import('./providers/TensorFlowProvider');

    tensorflowProvider = new TensorFlowProvider() as LazyProvider;
  }

  return tensorflowProvider;
}

export async function getGeminiProvider(): Promise<LazyProvider> {
  if (!geminiProvider) {
    const { GeminiProvider } = await import('./providers/GeminiProvider');

    geminiProvider = new GeminiProvider() as LazyProvider;
  }

  return geminiProvider;
}

export function resetProviders(): void {
  tensorflowProvider = null;
  geminiProvider = null;
}
