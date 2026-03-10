import { expect, test, type Page } from "@playwright/test";

function buildUser(workerIndex: number) {
  const unique = `${Date.now()}-${workerIndex}-${Math.floor(Math.random() * 10_000)}`;
  return {
    name: `E2E图片用户${workerIndex}`,
    email: `e2e-image-upload-${unique}@example.com`,
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

test.describe("图片上传", () => {
  test("管理员上传图片后无报错且可读取正确图片", async ({ page }, testInfo) => {
    const user = buildUser(testInfo.workerIndex);
    await register(page, user);

    await page.goto("/admin/images/upload");
    await expect(page.getByRole("heading", { name: "上传图片" })).toBeVisible();

    const imageName = `e2e-upload-${Date.now()}.png`;
    const expectedTitle = imageName.replace(/\.[^/.]+$/, "");
    const imageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );

    await page.locator('input[type="file"]').setInputFiles({
      name: imageName,
      mimeType: "image/png",
      buffer: imageBuffer,
    });

    await expect(page.getByText(imageName)).toBeVisible();
    await expect(page.locator('img[alt="预览图"]')).toBeVisible();
    await expect(page.locator("#title")).toHaveValue(expectedTitle);
    await expect(page.locator('img[alt="预览图"]')).toHaveAttribute("src", /blob:/);

    await page.getByRole("button", { name: "确认上传" }).click();

    await expect(page).toHaveURL(/\/admin\/images$/);
    await expect(page.getByText(expectedTitle)).toBeVisible();
    await expect(page.getByText("上传失败")).toHaveCount(0);
    await expect(page.getByText("请选择图片")).toHaveCount(0);

    const imageListResponse = await page.request.get(`/api/images?search=${encodeURIComponent(expectedTitle)}`);
    expect(imageListResponse.ok()).toBeTruthy();
    const imageListPayload = (await imageListResponse.json()) as {
      data: Array<{ title: string; mimeType: string; url: string }>;
    };
    const uploaded = imageListPayload.data.find((item) => item.title === expectedTitle);
    expect(uploaded).toBeTruthy();
    if (!uploaded) {
      throw new Error(`未在接口结果中找到上传图片: ${expectedTitle}`);
    }
    expect(uploaded?.mimeType).toBe("image/png");
    expect(uploaded?.url).toContain("/uploads/");

    const uploadedImageResponse = await page.request.get(uploaded.url);
    expect(uploadedImageResponse.ok()).toBeTruthy();
    expect(uploadedImageResponse.headers()["content-type"]).toContain("image/png");

    const uploadedImageBuffer = Buffer.from(await uploadedImageResponse.body());
    expect(uploadedImageBuffer.subarray(0, 8).equals(imageBuffer.subarray(0, 8))).toBeTruthy();
  });
});
