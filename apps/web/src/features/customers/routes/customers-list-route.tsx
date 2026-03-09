import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const customerEditSchema = z.object({
  name: z.string().trim().min(1, "请输入客户名称"),
  email: z.string().trim().refine((value) => !value || z.string().email().safeParse(value).success, "请输入有效邮箱"),
  phone: z.string().trim(),
  company: z.string().trim(),
  address: z.string().trim(),
  notes: z.string().trim(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

const customerUpdateActionSchema = customerEditSchema.extend({
  intent: z.literal("update"),
  id: z.string().min(1),
});

const customerDeleteActionSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1),
});

type CustomerEditValues = z.infer<typeof customerEditSchema>;

export async function loader({ request }: { request: Request }) {
  const data = await api.customers.list({ page: 1, limit: 10 }, request);
  return { customers: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update") {
    const parsed = customerUpdateActionSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      address: formData.get("address"),
      notes: formData.get("notes"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { id, intent: _intent, ...data } = parsed.data;
      await api.customers.update(id, data, request);
      toast.success("客户更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "delete") {
    const parsed = customerDeleteActionSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
    });

    if (!parsed.success) {
      return { error: "参数错误" };
    }

    try {
      await api.customers.delete(parsed.data.id, request);
      toast.success("客户删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function CustomersPage({
  loaderData,
}: {
  loaderData: {
    customers: Customer[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}) {
  const { customers: initialCustomers } = loaderData;
  const [customers] = useState(initialCustomers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetcher = useFetcher();
  const form = useForm<CustomerEditValues>({
    resolver: zodResolver(customerEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      notes: "",
      status: "ACTIVE",
    },
  });

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    form.reset({
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

  function handleSubmit(values: CustomerEditValues) {
    if (!editingCustomer) return;
    fetcher.submit(
      {
        intent: "update",
        id: editingCustomer.id,
        ...values,
      },
      { method: "post" },
    );
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
        <Button asChild>
          <Link to="/admin/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            添加客户
          </Link>
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
                      className={`rounded px-2 py-1 text-xs ${
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
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑客户</DialogTitle>
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
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">公司</Label>
                <Input id="company" {...form.register("company")} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">地址</Label>
                <Input id="address" {...form.register("address")} />
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
                        <SelectItem value="ACTIVE">活跃</SelectItem>
                        <SelectItem value="INACTIVE">不活跃</SelectItem>
                        <SelectItem value="ARCHIVED">已归档</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Input id="notes" {...form.register("notes")} />
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
