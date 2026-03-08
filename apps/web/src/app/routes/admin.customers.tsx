import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { api, Customer } from "@/lib/api";
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
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  const data = await api.customers.list({ page: 1, limit: 10 }, request);
  return { customers: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;
    const status = formData.get("status") as string;

    try {
      await api.customers.create({ name, email, phone, company, address, notes, status }, request);
      toast.success("客户创建成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;
    const status = formData.get("status") as string;

    try {
      await api.customers.update(id, { name, email, phone, company, address, notes, status }, request);
      toast.success("客户更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    try {
      await api.customers.delete(id, request);
      toast.success("客户删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function CustomersPage({ loaderData }: { loaderData: { customers: Customer[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }) {
  const { customers: initialCustomers } = loaderData;
  const [customers] = useState(initialCustomers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
    status: "ACTIVE",
  });

  const fetcher = useFetcher();

  function openCreateDialog() {
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", company: "", address: "", notes: "", status: "ACTIVE" });
    setDialogOpen(true);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
      notes: customer.notes || "",
      status: customer.status,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();
    if (editingCustomer) {
      form.append("intent", "update");
      form.append("id", editingCustomer.id);
    } else {
      form.append("intent", "create");
    }
    form.append("name", formData.name);
    form.append("email", formData.email);
    form.append("phone", formData.phone);
    form.append("company", formData.company);
    form.append("address", formData.address);
    form.append("notes", formData.notes);
    form.append("status", formData.status);
    fetcher.submit(form, { method: "post" });
  }

  function handleDelete(id: string) {
    if (!confirm("确定要删除这个客户吗？")) return;
    const form = new FormData();
    form.append("intent", "delete");
    form.append("id", id);
    fetcher.submit(form, { method: "post" });
  }

  const statusMap: Record<string, string> = {
    ACTIVE: "活跃",
    INACTIVE: "不活跃",
    ARCHIVED: "已归档",
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

      <Card>
        <CardHeader>
          <CardTitle>客户列表</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.company || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        customer.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : customer.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "编辑客户" : "创建客户"}</DialogTitle>
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
                <Select
                  value={formData.status}
                  onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                >
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">{editingCustomer ? "更新" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
