import { useState } from "react";
import { useFetcher } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, User } from "@/api";
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

import type { Route } from './+types/admin-users';

const userFormSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  name: z.string().trim(),
  role: z.enum(["USER", "ADMIN"]),
  password: z.string().optional(),
});

const userCreateSchema = userFormSchema.extend({
  intent: z.literal("create"),
  password: z.string().min(1, "请输入密码"),
});

const userUpdateSchema = userFormSchema.extend({
  intent: z.literal("update"),
  id: z.string().min(1),
});

const userDeleteSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export async function loader({ request }: { request: Request }) {
  const users = await api.users.list(request);
  const currentUser = await api.auth.me(request);
  if (!currentUser) {
    return { users: [], currentUser: null };
  }
  return { users, currentUser };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const currentUser = await api.auth.me(request);
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { error: "无权限添加用户" };
    }

    const parsed = userCreateSchema.safeParse({
      intent: formData.get("intent"),
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      role: formData.get("role"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { intent: _intent, ...data } = parsed.data;
      await api.users.create(data, request);
      toast.success("用户创建成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "update") {
    const parsed = userUpdateSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
      email: formData.get("email"),
      name: formData.get("name"),
      role: formData.get("role"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const updateData: { email: string; name: string; role: string; password?: string } = {
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
      };
      if (parsed.data.password) {
        updateData.password = parsed.data.password;
      }
      await api.users.update(parsed.data.id, updateData, request);
      toast.success("用户更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "delete") {
    const parsed = userDeleteSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
    });

    if (!parsed.success) {
      return { error: "参数错误" };
    }

    try {
      await api.users.delete(parsed.data.id, request);
      toast.success("用户删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { users: initialUsers, currentUser } = loaderData;
  const [users] = useState(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetcher = useFetcher();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { email: "", password: "", name: "", role: "USER" },
  });

  function openCreateDialog() {
    setEditingUser(null);
    form.reset({ email: "", password: "", name: "", role: "USER" });
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    form.reset({ email: user.email, password: "", name: user.name || "", role: user.role });
    setDialogOpen(true);
  }

  function handleSubmit(values: UserFormValues) {
    if (editingUser) {
      fetcher.submit(
        {
          intent: "update",
          id: editingUser.id,
          ...values,
        },
        { method: "post" },
      );
      return;
    }

    const parsed = userCreateSchema.safeParse({
      intent: "create",
      ...values,
    });

    if (!parsed.success) {
      const passwordIssue = parsed.error.issues.find((issue) => issue.path[0] === "password");
      if (passwordIssue) {
        form.setError("password", { message: passwordIssue.message });
      }
      return;
    }

    fetcher.submit(
      {
        intent: "create",
        ...values,
      },
      { method: "post" },
    );
  }

  function handleDelete(id: string) {
    if (!confirm("确定要删除这个用户吗？")) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    fetcher.submit(formData, { method: "post" });
  }

  const columns: Column<User>[] = [
    {
      label: "名称",
      render: (user) => user.name || "-",
    },
    {
      label: "邮箱",
      value: "email",
    },
    {
      label: "角色",
      render: (user) => (
        <span
          className={`rounded px-2 py-1 text-xs ${user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
            }`}
        >
          {user.role === "ADMIN" ? "管理员" : "用户"}
        </span>
      ),
    },
    {
      label: "操作",
      render: (user) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        {currentUser?.role === "ADMIN" && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={users} rowKey={(user) => user.id} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "编辑用户" : "创建用户"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">用户</SelectItem>
                        <SelectItem value="ADMIN">管理员</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? "新密码 (留空保持不变)" : "密码"}</Label>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password ? (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">{editingUser ? "更新" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
