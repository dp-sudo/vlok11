import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/stores';

import { projectService } from './ProjectService';

type SessionSnapshot = ReturnType<typeof useSessionStore.getState>;
type ProjectServiceInternals = {
  waitForSessionReady: () => Promise<void>;
};

function createSessionSnapshot(
  partial: Partial<Pick<SessionSnapshot, 'error' | 'status' | 'statusMessage'>>
): SessionSnapshot {
  return partial as SessionSnapshot;
}

describe('ProjectService', () => {
  const service = projectService as unknown as ProjectServiceInternals;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('应在会话已就绪时立即完成等待', async () => {
    const subscribeSpy = vi.spyOn(useSessionStore, 'subscribe');

    vi.spyOn(useSessionStore, 'getState').mockReturnValue(
      createSessionSnapshot({ status: 'ready' })
    );
    subscribeSpy.mockImplementation(() => vi.fn());

    await expect(service.waitForSessionReady()).resolves.toBeUndefined();
    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('应在会话已失败时立即抛出错误', async () => {
    const subscribeSpy = vi.spyOn(useSessionStore, 'subscribe');

    vi.spyOn(useSessionStore, 'getState').mockReturnValue(
      createSessionSnapshot({
        status: 'error',
        error: new Error('恢复失败'),
      })
    );
    subscribeSpy.mockImplementation(() => vi.fn());

    await expect(service.waitForSessionReady()).rejects.toThrow('恢复失败');
    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('应在订阅期间收到 ready 状态后完成等待', async () => {
    let listener: ((state: SessionSnapshot) => void) | undefined;
    const unsubscribe = vi.fn();

    vi.spyOn(useSessionStore, 'getState').mockReturnValue(
      createSessionSnapshot({ status: 'uploading' })
    );
    vi.spyOn(useSessionStore, 'subscribe').mockImplementation((callback) => {
      listener = callback as (state: SessionSnapshot) => void;

      return unsubscribe;
    });

    const waitPromise = service.waitForSessionReady();

    if (!listener) {
      throw new Error('订阅回调未正确注册');
    }

    listener(createSessionSnapshot({ status: 'ready' }));

    await expect(waitPromise).resolves.toBeUndefined();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('应在超时后终止等待并释放订阅', async () => {
    const unsubscribe = vi.fn();

    vi.spyOn(useSessionStore, 'getState').mockReturnValue(
      createSessionSnapshot({ status: 'uploading' })
    );
    vi.spyOn(useSessionStore, 'subscribe').mockImplementation(() => unsubscribe);

    const waitPromise = service.waitForSessionReady();
    const rejectionAssertion = expect(waitPromise).rejects.toThrow('项目恢复超时');

    await vi.advanceTimersByTimeAsync(30_000);

    await rejectionAssertion;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
