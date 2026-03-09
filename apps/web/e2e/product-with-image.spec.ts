import { expect, test } from "@playwright/test";

function buildUser(workerIndex: number) {
  const unique = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  return {
    name: `E2E用户${workerIndex}`,
    email: `e2e-product-img-${unique}@example.com`,
    password: "E2E-Password-123!",
  };
}

async function register(page: any, user: { name: string; email: string; password: string }) {
  await page.goto("/register");
  await page.getByLabel("名称").fill(user.name);
  await page.getByLabel("邮箱").fill(user.email);
  await page.getByLabel("密码").fill(user.password);
  await page.getByRole("button", { name: "注册" }).click();
  await expect(page).toHaveURL(/\/admin/);
}

test.describe("带图片的产品管理流程", () => {
  test("管理员可以创建和编辑带有图片的产品", async ({ page }, testInfo) => {
    // 0. 注册并登录
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    // 1. 导航到创建产品页面
    await page.goto("/admin/products/new");
    // 等待页面加载
    await expect(page.locator('h1:has-text("新建产品"), .text-2xl:has-text("新建产品")').first()).toBeVisible();

    const newProduct = {
      name: `带图产品-${testInfo.workerIndex}-${Date.now()}`,
      description: "这是一个带有测试图片的产品",
    };

    // 2. 填写基本信息
    await page.getByLabel("名称 *").fill(newProduct.name);
    await page.getByLabel("描述").fill(newProduct.description);

    // 3. 上传图片
    // 创建一个简单的 1x1 像素 PNG 图片 Buffer
    const imageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    // 找到 input[type="file"]
    // 注意：Shadcn/UI 或自定义上传组件可能隐藏了 input，但 Playwright 可以操作隐藏的 input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-product-image.png",
      mimeType: "image/png",
      buffer: imageBuffer,
    });
    
    // 4. 提交表单
    await page.getByRole("button", { name: "创建" }).click();

    // 验证重定向到列表页
    await expect(page).toHaveURL(/\/admin\/products/);
    
    // 验证列表中显示了产品名称
    await expect(page.getByText(newProduct.name)).toBeVisible();
    
    // 5. 编辑产品图片
    // 找到对应产品的行
    const productRow = page.locator('tr', { hasText: newProduct.name });
    // 点击编辑按钮 (通常是第一个 icon button)
    await productRow.getByRole("button").first().click();

    // 验证编辑对话框打开
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("名称 *")).toHaveValue(newProduct.name);

    // 验证图片预览存在 (img 标签)
    // ImageUploader 组件在有值时会显示 img
    // 我们查找 dialog 里的 img
    await expect(page.locator('div[role="dialog"] img')).toBeVisible();

    // 提交更新 (不做修改直接提交，或者修改图片)
    await page.getByRole("button", { name: "更新" }).click();

    // 验证成功提示
    await expect(page.getByText("产品更新成功")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();

    // 6. 清理：删除产品
    // 设置 dialog handler 处理 confirm
    page.once("dialog", dialog => dialog.accept());
    
    // 点击删除按钮 (通常是第二个 icon button，或者有红色 trash icon)
    // 这里假设是第二个按钮
    await productRow.getByRole("button").nth(1).click();
    
    // 等待删除成功提示或行消失
    // await expect(page.getByText("产品删除成功")).toBeVisible(); // Toast 可能消失得快
    await expect(page.getByText(newProduct.name)).toBeHidden();
  });
});
