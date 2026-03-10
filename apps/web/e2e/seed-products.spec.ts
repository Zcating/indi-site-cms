import { expect, test } from "@playwright/test";

const products = [
  { name: "草莓大福", description: "软糯Q弹的和果子" },
  { name: "奶油面包", description: "绵密奶香入口即化" },
  { name: "抹茶红豆", description: "宇治抹茶配甜蜜红豆" },
  { name: "樱花麻薯", description: "春日限定的浪漫" },
  { name: "黄油曲奇", description: "酥脆香浓的经典" },
  { name: "卡斯特拉", description: "日式柔软的云朵蛋糕" },
];

test.describe("批量创建产品", () => {
  test("创建初始产品数据", async ({ page }) => {
    // 1. 注册新用户作为管理员
    const unique = Date.now();
    await page.goto("/register");
    await page.getByLabel("名称").fill(`Admin-${unique}`);
    await page.getByLabel("邮箱").fill(`admin-${unique}@example.com`);
    await page.getByLabel("密码").fill("Password123!");
    await page.getByRole("button", { name: "注册" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    // 2. 循环创建产品
    for (const p of products) {
      const uniqueName = `${p.name}-${unique}`;
      console.log(`正在创建产品: ${uniqueName}`);
      
      // 导航到创建页面
      await page.goto("/admin/products/new");
      
      // 填写表单
      await page.getByLabel("名称 *").fill(uniqueName);
      await page.getByLabel("描述").fill(p.description);
      
      // 提交
      await page.getByRole("button", { name: "创建" }).click();
      
      // 验证跳转回列表页，确保创建成功
      await expect(page).toHaveURL(/\/admin\/products$/);
      
      // 验证列表包含该产品
      await expect(page.getByText(uniqueName)).toBeVisible();
    }
  });
});
