import type { AIService } from '@/features/ai/services/AIService';

interface KernelRuntimeState {
  aiService: AIService | null;
}

const kernelRuntimeState: KernelRuntimeState = {
  aiService: null,
};

export function getKernelAIService(): AIService | null {
  return kernelRuntimeState.aiService;
}

export function hasKernelAIService(): boolean {
  return kernelRuntimeState.aiService !== null;
}

export function setKernelAIService(aiService: AIService | null): void {
  kernelRuntimeState.aiService = aiService;
}

export function resetKernelRuntime(): void {
  kernelRuntimeState.aiService = null;
}
