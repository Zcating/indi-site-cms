import { useEffect, useState } from 'react';
import { api, Customer, Pagination } from '@/lib/api';
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

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', address: '', notes: '', status: 'ACTIVE'
  });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, search, status]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const data = await api.customers.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
      });
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', company: '', address: '', notes: '', status: 'ACTIVE' });
    setDialogOpen(true);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      notes: customer.notes || '',
      status: customer.status,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.customers.update(editingCustomer.id, formData);
        toast.success('客户更新成功');
      } else {
        await api.customers.create(formData);
        toast.success('客户创建成功');
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个客户吗？')) return;
    try {
      await api.customers.delete(id);
      toast.success('客户删除成功');
      fetchCustomers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  }

  const statusMap: Record<string, string> = {
    ACTIVE: '活跃',
    INACTIVE: '不活跃',
    ARCHIVED: '已归档',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          添加客户
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索客户..."
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
                <SelectItem value="ACTIVE">活跃</SelectItem>
                <SelectItem value="INACTIVE">不活跃</SelectItem>
                <SelectItem value="ARCHIVED">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>客户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">加载中...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>公司</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.company || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          customer.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusMap[customer.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
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
                  共 {pagination.total} 条记录，第 {pagination.page}/{pagination.totalPages} 页
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? '编辑客户' : '创建客户'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">公司</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">活跃</SelectItem>
                    <SelectItem value="INACTIVE">不活跃</SelectItem>
                    <SelectItem value="ARCHIVED">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit">{editingCustomer ? '更新' : '创建'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
