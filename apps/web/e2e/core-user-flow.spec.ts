import { expect, test, type Page } from "@playwright/test";

function buildUser(workerIndex: number) {
  const unique = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  return {
    name: `E2E用户${workerIndex}`,
    email: `e2e-${unique}@example.com`,
    password: "E2E-Password-123!",
  };
}

async function register(page: Page, user: { name: string; email: string; password: string }) {
  await page.goto("/register");
  await page.getByLabel("名称").fill(user.name);
  await page.getByLabel("邮箱").fill(user.email);
  await page.getByLabel("密码").fill(user.password);
  await page.getByRole("button", { name: "注册" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function registerAsUserRole(page: Page, user: { name: string; email: string; password: string }) {
  const response = await page.request.post("/api/auth/register", {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: "USER",
    },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("核心用户流程", () => {
  test("未登录访问后台会被重定向到登录页", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  });

  test("新用户注册后可访问后台并完成导航与退出登录", async ({ page }, testInfo) => {
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    await expect(page.getByRole("heading", { name: "仪表盘" })).toBeVisible();
    await page.getByRole("link", { name: "用户管理" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();

    await page.getByRole("link", { name: "客户管理" }).click();
    await expect(page).toHaveURL(/\/admin\/customers$/);
    await expect(page.getByRole("heading", { name: "客户管理" })).toBeVisible();

    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("邮箱").fill(user.email);
    await page.getByLabel("密码").fill(user.password);
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("错误密码登录会显示错误信息", async ({ page }, testInfo) => {
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("邮箱").fill(user.email);
    await page.getByLabel("密码").fill("Wrong-Password-1!");
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page.getByText(/Invalid credentials|登录失败/)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("普通用户不能拥有添加功能", async ({ page }, testInfo) => {
    const user = buildUser(testInfo.workerIndex);
    await registerAsUserRole(page, user);

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("button", { name: "添加用户" })).toHaveCount(0);
  });
});
