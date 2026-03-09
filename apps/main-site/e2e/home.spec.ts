import { test, expect } from '@playwright/test';

test.describe('Main Site E2E Tests', () => {
  test('should load home page with correct title and content', async ({ page }) => {
    // 1. 访问首页
    await page.goto('/');

    // 2. 验证页面标题
    await expect(page).toHaveTitle(/MIMOO/);

    // 3. 验证 Hero区域内容 (从 site.json 读取)
    await expect(page.locator('h1')).toContainText('日式手工烘焙');
    await expect(page.locator('.hero-subtitle')).toContainText('来自日本的手作温度');

    // 4. 验证产品列表展示
    const products = page.locator('.product-card');
    await expect(products).toHaveCount(6);
    await expect(products.first()).toContainText('草莓大福');

    // 5. 验证 OEM 服务区域
    await expect(page.locator('#oem')).toBeVisible();
    await expect(page.locator('#oem h2')).toContainText('代加工服务');

    // 6. 验证关于我们区域
    await expect(page.locator('#about')).toBeVisible();
    await expect(page.locator('#about h2')).toContainText('关于 Mimoo');

    // 7. 验证联系表单交互
    await page.locator('input[placeholder="请输入您的名字"]').fill('Test User');
    await page.locator('input[placeholder="手机号或邮箱"]').fill('13800000000');
    await page.locator('textarea').fill('E2E Test Message');

    // 监听 alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('消息已发送');
      await dialog.accept();
    });

    await page.getByText('发送消息').click();
  });

  test('should open consultation modal', async ({ page }) => {
    await page.goto('/');

    // 点击咨询按钮
    await page.locator('.consult-trigger').click();

    // 验证弹窗出现
    // 使用文本内容定位，因为 class 可能会变或者有动态生成的类
    const modal = page.getByText('快速咨询').locator('..').locator('..');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('快速咨询');

    // 验证关闭弹窗
    await page.getByText('×').click();
    await expect(modal).not.toBeVisible();
  });

  test('should navigate via header links', async ({ page }) => {
    await page.goto('/');

    // 点击 "探索产品" 按钮
    await page.getByText('探索产品').click();

    // 验证 URL 包含锚点
    await expect(page).toHaveURL(/.*#products/);
  });
});
