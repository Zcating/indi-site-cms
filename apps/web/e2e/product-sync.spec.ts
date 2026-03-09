import { expect, test, type Page } from "@playwright/test";

function buildUser(workerIndex: number) {
  const unique = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  return {
    name: `E2E Admin ${workerIndex}`,
    email: `admin-sync-${unique}@example.com`,
    password: "Password-123!",
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

test.describe("产品数据同步功能", () => {
  test("修改产品名称后，官网管理页面的产品列表应自动更新", async ({ page }, testInfo) => {
    // 1. 管理员登录
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    // 2. 创建一个新产品
    const productName = `同步测试产品-${testInfo.workerIndex}-${Date.now()}`;
    await page.goto("/admin/products/new");
    await page.getByLabel("名称 *").fill(productName);
    await page.getByLabel("描述").fill("这是一个用于测试同步功能的产品");
    await page.getByRole("button", { name: "创建" }).click();
    
    // 验证产品创建成功并返回列表
    await expect(page).toHaveURL(/\/admin\/products$/);
    await expect(page.getByText(productName)).toBeVisible();

    // 3. 进入页面创建/编辑页 (pages-list-route)
    await page.goto("/admin/pages");
    
    // 确保页面加载完成
    await expect(page.getByRole("heading", { name: /创建官网页面|编辑官网页面/ })).toBeVisible();

    // 为了防止 Slug 冲突（如果是共享环境），修改基础信息
    // 默认在 "基础信息" 标签页
    const uniqueSlug = `test-page-${testInfo.workerIndex}-${Date.now()}`;
    // 使用 name 属性定位，因为 label 关联可能不稳定
    await page.locator('input[name="title"]').fill(`测试页面 ${uniqueSlug}`);
    await page.locator('input[name="slug"]').fill(uniqueSlug);

    // 切换到"产品列表"标签
    await page.getByRole("tab", { name: "产品列表" }).click();
    
    // 添加产品
    await page.getByRole("button", { name: "添加产品" }).click();
    
    // 在下拉框中选择该产品
    // 注意：Shadcn UI 的 Select 组件通常需要先点击 Trigger，再点击 Option
    // 假设是第一个添加的产品，或者根据 UI 结构定位
    const card = page.locator(".grid > .relative").last(); // 获取最新添加的卡片
    await card.getByRole("combobox").click();
    
    // 等待选项出现并点击
    await page.getByRole("option", { name: productName }).click();
    
    // 验证名称已自动填充
    const nameInput = card.getByPlaceholder("名称");
    await expect(nameInput).toHaveValue(productName);
    
    // 填充其他必填字段（虽然 schema 允许空字符串，但为了稳健性还是填充）
    await card.getByPlaceholder("色调 (Tailwind)").fill("bg-red-500");
    await card.getByPlaceholder("Emoji").fill("🧪");

    // 保存页面
    // 监听保存请求
    const savePromise = page.waitForResponse(response => 
      response.url().includes("/admin/pages") && response.request().method() === "POST"
    );
    
    await page.getByRole("button", { name: "保存更改" }).click();
    
    const response = await savePromise;
    expect(response.ok(), `保存请求失败: ${response.status()} ${await response.text()}`).toBeTruthy();

    // 验证保存成功（可能是创建或更新）
    // Toast 可能不稳定，既然请求成功，我们继续后续步骤
    // await expect(page.getByText("页面更新成功").or(page.getByText("页面创建成功"))).toBeVisible();

    // 4. 修改该产品的名称
    const newProductName = `已更新的产品名称-${testInfo.workerIndex}-${Date.now()}`;
    await page.goto("/admin/products");
    
    // 找到对应产品的行，点击编辑按钮
    const productRow = page.getByRole("row").filter({ hasText: productName });
    await productRow.getByRole("button").first().click();
    
    // 编辑产品名称
    // 假设编辑是在弹窗中
    await expect(page.getByRole("dialog", { name: "编辑产品" })).toBeVisible();
    await page.getByLabel("名称").fill(newProductName);
    await page.getByRole("button", { name: "更新" }).click();
    
    // 验证更新成功
    await expect(page.getByRole("dialog")).toBeHidden();
    // 刷新页面以确保列表更新（虽然应该自动更新，但为了稳健性）
    await page.reload();
    await expect(page.getByText(newProductName)).toBeVisible();

    // 5. 再次进入页面编辑页，验证"产品列表"中显示的名称是否已自动更新
    await page.goto("/admin/pages");
    
    // 切换到"产品列表"标签
    await page.getByRole("tab", { name: "产品列表" }).click();
    
    // 验证名称输入框的值是否已更新
    // 需要找到对应的卡片。由于我们刚刚保存了，它应该在列表中。
    // 我们查找包含新名称的输入框，或者检查之前那个位置的输入框
    // 这里的逻辑是：页面加载时 transformToForm 会根据 ID 查找最新名称并填充
    
    // 我们可以直接查找 input value
    // 注意：getByDisplayValue 可能在旧版本 Playwright 不可用，使用 locator 替代
    // const updatedNameInput = page.getByDisplayValue(newProductName);
    // await expect(updatedNameInput).toBeVisible();

    // 更稳健的方式：检查最后一个产品卡片的名称输入框
    const lastProductCard = page.locator(".grid > .relative").last();
    const nameInputUpdated = lastProductCard.getByPlaceholder("名称");
    await expect(nameInputUpdated).toHaveValue(newProductName);
    
    // 或者更严谨一点，找到对应的 Select 选中的是该产品 ID (虽然 Select UI 显示的是 Name，Value 是 ID)
    // 简单起见，验证页面上存在这个新名称的输入框即可，因为这是我们在 Page Editor 中期望看到的
  });
});
