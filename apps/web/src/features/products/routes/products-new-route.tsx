import { useEffect } from "react";
import { Form, Link, redirect, useActionData, useSubmit } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // 移除非字母数字字符
    .replace(/\s+/g, "-") // 空格转连字符
    .replace(/-+/g, "-"); // 移除重复连字符
}

const productCreateSchema = z.object({
  name: z.string().trim().min(1, "请输入产品名称"),
  slug: z.string().trim().min(1, "请输入产品 Slug"),
  description: z.string().trim(),
  price: z.coerce.number().nonnegative("价格不能小于 0"),
  stock: z.coerce.number().int("库存必须为整数").nonnegative("库存不能小于 0"),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

type ProductCreateValues = z.infer<typeof productCreateSchema>;

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const parsed = productCreateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "表单校验失败" };
  }

  await api.products.create(parsed.data, request);
  return redirect("/admin/products");
}

export default function NewProductPage() {
  const actionData = useActionData<{ error?: string }>();
  const submit = useSubmit();
  const form = useForm<ProductCreateValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      status: "DRAFT",
    },
  });

  // 监听名称变化自动生成 Slug
  const name = form.watch("name");
  useEffect(() => {
    if (name && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(name));
    }
  }, [name, form]);

  function onSubmit(values: ProductCreateValues) {
    submit(values, { method: "post" });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>新建产品</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" placeholder="new-product" {...form.register("slug")} />
              {form.formState.errors.slug ? (
                <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">价格 *</Label>
              <Input id="price" type="number" step="0.01" min={0} {...form.register("price")} />
              {form.formState.errors.price ? (
                <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">库存</Label>
              <Input id="stock" type="number" min={0} {...form.register("stock")} />
              {form.formState.errors.stock ? (
                <p className="text-sm text-red-500">{form.formState.errors.stock.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">草稿</SelectItem>
                      <SelectItem value="ACTIVE">上架</SelectItem>
                      <SelectItem value="INACTIVE">下架</SelectItem>
                      <SelectItem value="ARCHIVED">已归档</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">描述</Label>
              <textarea
                id="description"
                {...form.register("description")}
                className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="请输入产品描述"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            {actionData?.error ? (
              <p className="text-sm text-red-500">{actionData.error}</p>
            ) : null}
            <Button type="submit">创建</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/products">取消</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
