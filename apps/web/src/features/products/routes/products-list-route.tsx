import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type Product } from "@/lib/api";
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

const productEditSchema = z.object({
  name: z.string().trim().min(1, "请输入产品名称"),
  slug: z.string().trim().min(1, "请输入产品 Slug"),
  description: z.string().trim(),
  price: z.coerce.number().nonnegative("价格不能小于 0"),
  stock: z.coerce.number().int("库存必须为整数").nonnegative("库存不能小于 0"),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
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

export async function loader({ request }: { request: Request }) {
  const data = await api.products.list({ page: 1, limit: 10 }, request);
  return { products: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update") {
    const parsed = productUpdateActionSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
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
      intent: formData.get("intent"),
      id: formData.get("id"),
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
}: {
  loaderData: {
    products: Product[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}) {
  const { products: initialProducts } = loaderData;
  const [products] = useState(initialProducts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetcher = useFetcher();
  const form = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      status: "DRAFT",
    },
  });

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: Number(product.price),
      stock: product.stock,
      status: product.status,
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: ProductEditValues) {
    if (!editingProduct) return;
    fetcher.submit(
      {
        intent: "update",
        id: editingProduct.id,
        ...values,
      },
      { method: "post" },
    );
  }

  function handleDelete(id: string) {
    if (!confirm("确定要删除这个产品吗？")) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    fetcher.submit(formData, { method: "post" });
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
      label: "Slug",
      render: (product) => <code className="rounded bg-gray-100 px-2 py-1 text-xs">/{product.slug}</code>,
    },
    {
      label: "价格",
      render: (product) => `¥${Number(product.price).toFixed(2)}`,
    },
    {
      label: "库存",
      value: "stock",
    },
    {
      label: "状态",
      render: (product) => (
        <span
          className={`rounded px-2 py-1 text-xs ${product.status === "ACTIVE"
            ? "bg-green-100 text-green-800"
            : product.status === "DRAFT"
              ? "bg-yellow-100 text-yellow-800"
              : product.status === "INACTIVE"
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
            }`}
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
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" {...form.register("slug")} />
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
