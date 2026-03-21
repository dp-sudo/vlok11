import path from 'node:path';

import { expect, test } from '@playwright/test';

test.describe('项目工程闭环', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__TEST_MODE__ = true;
    });
  });

  test('应完成上传、保存、重开与再次导出', async ({ page }) => {
    const fixturePath = path.resolve(process.cwd(), 'test_valid.png');

    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.__IMMERSA_TEST_API__));

    await page.getByTestId('upload-input').setInputFiles(fixturePath);
    await expect(page.getByTestId('scene-viewer')).toBeVisible({ timeout: 20000 });

    const initialSummary = await page.evaluate(() => window.__IMMERSA_TEST_API__?.getSessionSummary());

    expect(initialSummary?.status).toBe('ready');
    expect(initialSummary?.hasResult).toBe(true);

    const projectData = await page.evaluate(() => window.__IMMERSA_TEST_API__?.exportProjectData());

    expect(projectData?.processing?.image).toBeTruthy();
    expect(projectData?.processing?.depthMap).toBeTruthy();
    expect(projectData?.assets?.sourceAsset).toBeTruthy();

    await page.reload();
    await page.waitForFunction(() => Boolean(window.__IMMERSA_TEST_API__));
    await expect(page.getByTestId('upload-panel')).toBeVisible({ timeout: 10000 });

    await page.evaluate(async (data) => {
      if (!window.__IMMERSA_TEST_API__) {
        throw new Error('测试接口未注入');
      }

      await window.__IMMERSA_TEST_API__.importProjectData(data);
    }, projectData);

    await expect(page.getByTestId('scene-viewer')).toBeVisible({ timeout: 20000 });

    const restoredSummary = await page.evaluate(() =>
      window.__IMMERSA_TEST_API__?.getSessionSummary()
    );

    expect(restoredSummary?.status).toBe('ready');
    expect(restoredSummary?.hasResult).toBe(true);
    await page.waitForFunction(() => window.__IMMERSA_TEST_API__?.isSceneReady?.() === true, undefined, {
      timeout: 20000,
    });

    await page.evaluate(() => {
      const exported = window.__IMMERSA_TEST_API__?.triggerSceneExport?.();

      if (exported !== true) {
        throw new Error('场景导出尚未就绪');
      }
    });

    await page.waitForFunction(
      () => Boolean(window.__IMMERSA_TEST_API__?.getSessionSummary().lastDownload?.filename),
      undefined,
      { timeout: 20000 }
    );

    const finalSummary = await page.evaluate(() => window.__IMMERSA_TEST_API__?.getSessionSummary());

    expect(finalSummary?.lastDownload?.filename).toMatch(/\.glb$|\.gltf$/i);
  });
});
