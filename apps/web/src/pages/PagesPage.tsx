import { useEffect, useState } from 'react';
import { api, Page, Pagination } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    slug: '', title: '', content: '', metaTitle: '', metaDescription: '', status: 'DRAFT'
  });

  useEffect(() => {
    fetchPages();
  }, [pagination.page, search, status]);

  async function fetchPages() {
    setLoading(true);
    try {
      const data = await api.pages.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
      });
      setPages(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('获取页面列表失败');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingPage(null);
    setFormData({ slug: '', title: '', content: '', metaTitle: '', metaDescription: '', status: 'DRAFT' });
    setDialogOpen(true);
  }

  function openEditDialog(page: Page) {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      status: page.status,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingPage) {
        await api.pages.update(editingPage.id, formData);
        toast.success('页面更新成功');
      } else {
        await api.pages.create(formData);
        toast.success('页面创建成功');
      }
      setDialogOpen(false);
      fetchPages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个页面吗？')) return;
    try {
      await api.pages.delete(id);
      toast.success('页面删除成功');
      fetchPages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  }

  const statusMap: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">官网管理</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          创建页面
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索页面..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="PUBLISHED">已发布</SelectItem>
                <SelectItem value="ARCHIVED">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>页面列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">加载中...</div>
          ) : (
            <>
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
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{page.slug}</code>
                      </TableCell>
                      <TableCell>{page.metaTitle || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          page.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          page.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusMap[page.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(page)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  共 {pagination.total} 个页面，第 {pagination.page}/{pagination.totalPages} 页
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPage ? '编辑页面' : '创建页面'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="page-slug"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="PUBLISHED">已发布</SelectItem>
                    <SelectItem value="ARCHIVED">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaTitle">SEO 标题</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="metaDescription">SEO 描述</Label>
                <Input
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="content">内容</Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="页面内容 (支持 HTML)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit">{editingPage ? '更新' : '创建'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
