import { useState } from "react";
import { useFetcher } from "react-router";
import { api } from "@/lib/api";
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

export async function loader({ request }: { request: Request }) {
  const data = await api.pages.list({ page: 1, limit: 10 }, request);
  return { pages: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const slug = formData.get("slug") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const status = formData.get("status") as string;

    try {
      await api.pages.create({ slug, title, content, metaTitle, metaDescription, status }, request);
      toast.success("页面创建成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const slug = formData.get("slug") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const status = formData.get("status") as string;

    try {
      await api.pages.update(id, { slug, title, content, metaTitle, metaDescription, status }, request);
      toast.success("页面更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    try {
      await api.pages.delete(id, request);
      toast.success("页面删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function PagesPage({ loaderData }: { loaderData: { pages: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }) {
  const { pages: initialPages } = loaderData;
  const [pages] = useState(initialPages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    status: "DRAFT",
  });

  const fetcher = useFetcher();

  function openCreateDialog() {
    setEditingPage(null);
    setFormData({ slug: "", title: "", content: "", metaTitle: "", metaDescription: "", status: "DRAFT" });
    setDialogOpen(true);
  }

  function openEditDialog(page: any) {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: page.status,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();
    if (editingPage) {
      form.append("intent", "update");
      form.append("id", editingPage.id);
    } else {
      form.append("intent", "create");
    }
    form.append("slug", formData.slug);
    form.append("title", formData.title);
    form.append("content", formData.content);
    form.append("metaTitle", formData.metaTitle);
    form.append("metaDescription", formData.metaDescription);
    form.append("status", formData.status);
    fetcher.submit(form, { method: "post" });
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">官网管理</h1>
        <Button onClick={openCreateDialog}><Plus className="w-4 h-4 mr-2" />创建页面</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>页面列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>标题</TableHead><TableHead>Slug</TableHead><TableHead>SEO 标题</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell><code className="text-sm bg-gray-100 px-2 py-1 rounded">/{page.slug}</code></TableCell>
                  <TableCell>{page.metaTitle || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${page.status === "PUBLISHED" ? "bg-green-100 text-green-800" : page.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                      {statusMap[page.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(page)}><Pencil className="w-4 h-4" /></Button>
                      <Button asChild variant="ghost" size="icon">
                        <a href={`/${page.slug}`} target="_blank" rel="noreferrer" title="跳转官网">
                          <Eye className="w-4 h-4 text-blue-500" />
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <a href={`/api/pages/${page.id}/export-html`} title="导出 HTML">
                          <Download className="w-4 h-4 text-emerald-600" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editingPage ? "编辑页面" : "创建页面"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label htmlFor="title">标题 *</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="slug">Slug *</Label><Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="page-slug" required /></div>
              <div className="space-y-2"><Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="PUBLISHED">已发布</SelectItem><SelectItem value="ARCHIVED">已归档</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="metaTitle">SEO 标题</Label><Input id="metaTitle" value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} /></div>
              <div className="space-y-2 col-span-2"><Label htmlFor="metaDescription">SEO 描述</Label><Input id="metaDescription" value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} /></div>
              <div className="space-y-2 col-span-2"><Label htmlFor="content">内容</Label><textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="页面内容 (支持 HTML)" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit">{editingPage ? "更新" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
