import { useState } from "react";
import { useFetcher } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type Page } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2, Eye, Download } from "lucide-react";

const pageFormSchema = z.object({
  slug: z.string().trim().min(1, "请输入 Slug"),
  title: z.string().trim().min(1, "请输入标题"),
  content: z.string().trim(),
  metaTitle: z.string().trim(),
  metaDescription: z.string().trim(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

const pageCreateSchema = pageFormSchema.extend({
  intent: z.literal("create"),
});

const pageUpdateSchema = pageFormSchema.extend({
  intent: z.literal("update"),
  id: z.string().min(1),
});

const pageDeleteSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1),
});

type PageFormValues = z.infer<typeof pageFormSchema>;

export async function loader({ request }: { request: Request }) {
  const data = await api.pages.list({ page: 1, limit: 10 }, request);
  return { pages: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const parsed = pageCreateSchema.safeParse({
      intent: formData.get("intent"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      content: formData.get("content"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { intent: _intent, ...data } = parsed.data;
      await api.pages.create(data, request);
      toast.success("页面创建成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "update") {
    const parsed = pageUpdateSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      content: formData.get("content"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { id, intent: _intent, ...data } = parsed.data;
      await api.pages.update(id, data, request);
      toast.success("页面更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "delete") {
    const parsed = pageDeleteSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
    });

    if (!parsed.success) {
      return { error: "参数错误" };
    }

    try {
      await api.pages.delete(parsed.data.id, request);
      toast.success("页面删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function PagesPage({
  loaderData,
}: {
  loaderData: {
    pages: Page[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}) {
  const { pages: initialPages } = loaderData;
  const [pages] = useState(initialPages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  const fetcher = useFetcher();
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      slug: "",
      title: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      status: "DRAFT",
    },
  });

  function openCreateDialog() {
    setEditingPage(null);
    form.reset({ slug: "", title: "", content: "", metaTitle: "", metaDescription: "", status: "DRAFT" });
    setDialogOpen(true);
  }

  function openEditDialog(page: Page) {
    setEditingPage(page);
    form.reset({
      slug: page.slug,
      title: page.title,
      content: page.content || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: page.status,
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: PageFormValues) {
    if (editingPage) {
      fetcher.submit(
        {
          intent: "update",
          id: editingPage.id,
          ...values,
        },
        { method: "post" },
      );
    } else {
      fetcher.submit(
        {
          intent: "create",
          ...values,
        },
        { method: "post" },
      );
    }
  }

  function handleDelete(id: string) {
    if (!confirm("确定要删除这个页面吗？")) return;
    const form = new FormData();
    form.append("intent", "delete");
    form.append("id", id);
    fetcher.submit(form, { method: "post" });
  }

  const statusMap: Record<string, string> = { DRAFT: "草稿", PUBLISHED: "已发布", ARCHIVED: "已归档" };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">官网管理</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          创建页面
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>页面列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>SEO 标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">/{page.slug}</code>
                  </TableCell>
                  <TableCell>{page.metaTitle || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        page.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : page.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusMap[page.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(page)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <a href={`/${page.slug}`} target="_blank" rel="noreferrer" title="跳转官网">
                          <Eye className="h-4 w-4 text-blue-500" />
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <a href={`/api/pages/${page.id}/export-html`} title="导出 HTML">
                          <Download className="h-4 w-4 text-emerald-600" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPage ? "编辑页面" : "创建页面"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input id="title" {...form.register("title")} />
                {form.formState.errors.title ? (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" placeholder="page-slug" {...form.register("slug")} />
                {form.formState.errors.slug ? (
                  <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
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
                        <SelectItem value="PUBLISHED">已发布</SelectItem>
                        <SelectItem value="ARCHIVED">已归档</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaTitle">SEO 标题</Label>
                <Input id="metaTitle" {...form.register("metaTitle")} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="metaDescription">SEO 描述</Label>
                <Input id="metaDescription" {...form.register("metaDescription")} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="content">内容</Label>
                <textarea
                  id="content"
                  {...form.register("content")}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="页面内容 (支持 HTML)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">{editingPage ? "更新" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
