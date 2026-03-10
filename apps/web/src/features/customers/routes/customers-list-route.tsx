import { useState, useEffect } from "react";
import { Link, useFetcher, useSearchParams } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, Customer } from "@/api";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Route } from "./+types/customers-list-route";

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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const data = await api.customers.list({ page, limit }, request);
  return { customers: data.data, pagination: data };
}

export async function action({ request }: Route.ActionArgs) {
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
}: Route.ComponentProps) {
  const { customers: initialCustomers, pagination } = loaderData;
  const [customers, setCustomers] = useState(initialCustomers);
  const [currentPagination, setCurrentPagination] = useState(pagination);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1");

  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if ("success" in fetcher.data && fetcher.data.success) {
        api.customers.list({ page: currentPage, limit: 10 }).then((data) => {
          setCustomers(data.data);
          setCurrentPagination(data);
        });
      }
    }
  }, [fetcher.state, fetcher.data]);
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

  const columns: Column<Customer>[] = [
    {
      label: "名称",
      value: "name",
      className: "font-medium",
    },
    {
      label: "邮箱",
      render: (customer) => customer.email || "-",
    },
    {
      label: "电话",
      render: (customer) => customer.phone || "-",
    },
    {
      label: "公司",
      render: (customer) => customer.company || "-",
    },
    {
      label: "状态",
      render: (customer) => (
        <span
          className={`rounded px-2 py-1 text-xs ${customer.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : customer.status === "INACTIVE"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
        >
          {statusMap[customer.status]}
        </span>
      ),
    },
    {
      label: "操作",
      render: (customer) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

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
          <DataTable columns={columns} data={customers} rowKey={(customer) => customer.id} />
          {currentPagination.pageCount > 0 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setSearchParams({ page: String(currentPage - 1) });
                        }
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: currentPagination.pageCount }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setSearchParams({ page: String(page) });
                          }}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }).slice(Math.max(0, currentPage - 3), Math.min(currentPagination.pageCount, currentPage + 2))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < currentPagination.pageCount) {
                          setSearchParams({ page: String(currentPage + 1) });
                        }
                      }}
                      className={currentPage >= currentPagination.pageCount ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
