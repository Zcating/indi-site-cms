import { useEffect, useState } from "react";
import { Form, Link, redirect, useActionData, useSubmit } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/internal/image-uploader";
import { toast } from "sonner";
import type { Route } from "./+types/products-new-route";

const productCreateSchema = z.object({
  name: z.string().trim().min(1, "请输入产品名称"),
  description: z.string().trim(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
  imageIds: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

type ProductCreateValues = z.infer<typeof productCreateSchema>;

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const imageIds = formData.getAll("imageIds") as string[];

  const parsed = productCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    imageIds: imageIds.length > 0 ? imageIds : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "表单校验失败" };
  }

  await api.products.create(parsed.data, request);
  return redirect("/admin/products");
}

export default function NewProductPage({ actionData }: Route.ComponentProps) {
  const submit = useSubmit();

  const form = useForm<ProductCreateValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "DRAFT",
      imageUrl: "",
    },
  });

  async function onSubmit(values: ProductCreateValues) {
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.description) formData.append("description", values.description);
    formData.append("status", values.status);

    const imageUrl = values.imageUrl;

    if (imageUrl && imageUrl.startsWith('blob:')) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image.png", { type: blob.type });
        const image = await api.images.upload(file, { title: values.name });
        formData.append("imageIds", image.id);
        toast.success("图片上传成功");
      } catch (error) {
        toast.error("图片上传失败");
        console.error(error);
        return;
      }
    }

    submit(formData, { method: "post" });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>新建产品</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>图片</Label>
              <Controller
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <ImageUploader 
                    value={field.value}
                    onChange={field.onChange} 
                  />
                )}
              />
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

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                className="min-h-[140px]"
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
