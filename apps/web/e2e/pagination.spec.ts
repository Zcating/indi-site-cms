import { expect, test } from "@playwright/test";

function buildUser(workerIndex: number) {
  const unique = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  return {
    name: `E2E用户${workerIndex}`,
    email: `e2e-pagination-${unique}@example.com`,
    password: "E2E-Password-123!",
  };
}

async function register(page: ReturnType<typeof test>["page"], user: { name: string; email: string; password: string }) {
  await page.goto("/register");
  await page.getByLabel("名称").fill(user.name);
  await page.getByLabel("邮箱").fill(user.email);
  await page.getByLabel("密码").fill(user.password);
  await page.getByRole("button", { name: "注册" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("分页功能", () => {
  test("客户列表分页正常工作", async ({ page }, testInfo) => {
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    // 导航到客户管理
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: "客户管理" })).toBeVisible();

    // 验证分页组件存在
    await expect(page.locator("nav[aria-label='pagination']")).toBeVisible();

    // 验证分页显示正确（初始在第1页）
    const page1Link = page.getByRole("link", { name: "1" });
    await expect(page1Link).toBeVisible();

    // 获取初始客户数量
    const initialRowCount = await page.locator("table tbody tr").count();

    // 如果有多个页面，尝试点击第2页
    const nextButton = page.locator("nav[aria-label='pagination']").getByRole("link", { name: "Next" });
    
    // 检查是否有下一页按钮可用
    const isNextDisabled = await nextButton.evaluate((el) => el.classList.contains("pointer-events-none"));
    
    if (!isNextDisabled) {
      // 点击第2页
      await page.locator("nav[aria-label='pagination']").getByRole("link", { name: "2" }).click();
      
      // 等待页面更新
      await page.waitForLoadState("networkidle");
      
      // 验证URL参数变化
      await expect(page).toHaveURL(/page=2/);
      
      // 验证数据已更新（通过分页链接的激活状态）
      const activePage = page.locator("nav[aria-label='pagination']").locator("[aria-current='page']");
      await expect(activePage).toHaveText("2");
    }
  });

  test("产品列表分页正常工作", async ({ page }, testInfo) => {
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    // 导航到产品管理
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "产品管理" })).toBeVisible();

    // 验证分页组件存在
    await expect(page.locator("nav[aria-label='pagination']")).toBeVisible();

    // 验证分页显示正确（初始在第1页）
    const page1Link = page.getByRole("link", { name: "1" });
    await expect(page1Link).toBeVisible();

    // 获取初始产品行数
    const initialRowCount = await page.locator("table tbody tr").count();

    // 如果有多个页面，尝试点击第2页
    const nextButton = page.locator("nav[aria-label='pagination']").getByRole("link", { name: "Next" });
    
    // 检查是否有下一页按钮可用
    const isNextDisabled = await nextButton.evaluate((el) => el.classList.contains("pointer-events-none"));
    
    if (!isNextDisabled) {
      // 点击第2页
      await page.locator("nav[aria-label='pagination']").getByRole("link", { name: "2" }).click();
      
      // 等待页面更新
      await page.waitForLoadState("networkidle");
      
      // 验证URL参数变化
      await expect(page).toHaveURL(/page=2/);
      
      // 验证数据已更新（通过分页链接的激活状态）
      const activePage = page.locator("nav[aria-label='pagination']").locator("[aria-current='page']");
      await expect(activePage).toHaveText("2");
    }
  });
});
