import { type AppKernel, type BootstrapConfig, getAppKernel } from '@/app/AppKernel';

export type { BootstrapConfig } from '@/app/AppKernel';

export async function bootstrap(config: BootstrapConfig = {}): Promise<AppKernel> {
  return getAppKernel().initialize(config);
}

export function isInitialized(): boolean {
  return getAppKernel().isReady();
}

export async function shutdown(): Promise<void> {
  await getAppKernel().shutdown();
}
