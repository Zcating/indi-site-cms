import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type Product } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/internal/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/internal/image-uploader";
import type { Route } from "./+types/products-list-route";
import { Image } from "@/components/internal/image";

const productEditSchema = z.object({
  name: z.string().trim().min(1, "请输入产品名称"),
  slug: z.string().optional(),
  description: z.string().trim(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
  imageUrl: z.string().optional(),
});

const productUpdateActionSchema = productEditSchema.extend({
  intent: z.literal("update"),
  id: z.string().min(1),
});

const productDeleteActionSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1),
});

type ProductEditValues = z.infer<typeof productEditSchema>;

export async function loader({ request }: Route.LoaderArgs) {
  const data = await api.products.list({ page: 1, limit: 10 }, request);
  return { products: data.data, pagination: data.pagination };
}

export async function action({ request }: Route.ActionArgs) {
  const data = await request.json();
  const intent = data.intent;

  if (intent === "update") {
    const parsed = productUpdateActionSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { id, intent: _intent, ...data } = parsed.data;
      await api.products.update(id, data, request);
      toast.success("产品更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "delete") {
    const parsed = productDeleteActionSchema.safeParse({
      intent: data.intent,
      id: data.id,
    });

    if (!parsed.success) {
      return { error: "参数错误" };
    }

    try {
      await api.products.delete(parsed.data.id, request);
      toast.success("产品删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function ProductsPage({
  loaderData,
}: Route.ComponentProps) {
  const { products } = loaderData;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetcher = useFetcher();
  const form = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "DRAFT",
      imageUrl: "",
    },
  });

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      status: product.status,
      imageUrl: product.imageUrl || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(values: ProductEditValues) {
    if (!editingProduct) return;
    const imageUrl = values.imageUrl;
    // 如果有新选择的文件，先上传
    if (imageUrl && imageUrl.startsWith('blob:')) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image.png", { type: blob.type });
        const image = await api.images.upload(file, { title: values.name });
        values.imageUrl = image.absoluteUrl || image.url;
        toast.success("图片上传成功");
      } catch (error) {
        toast.error("图片上传失败");
        console.error(error);
        return;
      }
    }

    fetcher.submit(
      {
        intent: "update",
        id: editingProduct.id,
        ...values,
      },
      { method: "post", encType: "application/json" }
    );
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    if (!confirm("确定要删除这个产品吗？")) return;
    fetcher.submit(
      { intent: "delete", id },
      { method: "post", encType: "application/json" }
    );
  }

  const statusMap: Record<Product["status"], string> = {
    DRAFT: "草稿",
    ACTIVE: "上架",
    INACTIVE: "下架",
    ARCHIVED: "已归档",
  };

  const columns: Column<Product>[] = [
    {
      label: "名称",
      value: "name",
      className: "font-medium",
    },
    {
      label: "图片",
      render: (product) => (
        <div className="flex -space-x-2 overflow-hidden">
          <Image
            src={product.imageUrl || product.images?.[0]?.url || ""}
            alt={product.name}
          />
        </div>
      ),
    },
    {
      label: "状态",
      render: (product) => (
        <span
          className={cn(
            "rounded px-2 py-1 text-xs",
            {
              "bg-green-100 text-green-800": product.status === "ACTIVE",
              "bg-yellow-100 text-yellow-800": product.status === "DRAFT",
              "bg-orange-100 text-orange-800": product.status === "INACTIVE",
              "bg-gray-100 text-gray-800": !["ACTIVE", "DRAFT", "INACTIVE"].includes(product.status)
            }
          )}
        >
          {statusMap[product.status]}
        </span>
      ),
    },
    {
      label: "操作",
      render: (product) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            添加产品
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={products} rowKey={(product) => product.id} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑产品</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2 hidden">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register("slug")} />
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
                      <SelectTrigger>
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
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="请输入产品描述"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">更新</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
