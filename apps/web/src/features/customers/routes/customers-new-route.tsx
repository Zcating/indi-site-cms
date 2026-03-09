import { Form, Link, redirect, useActionData, useSubmit } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "请输入客户名称"),
  email: z.string().trim().refine((value) => !value || z.string().email().safeParse(value).success, "请输入有效邮箱"),
  phone: z.string().trim(),
  company: z.string().trim(),
  address: z.string().trim(),
  notes: z.string().trim(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

type CustomerCreateValues = z.infer<typeof customerCreateSchema>;

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const parsed = customerCreateSchema.safeParse({
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

  await api.customers.create(parsed.data, request);
  return redirect("/admin/customers");
}

export default function NewCustomerPage() {
  const actionData = useActionData<{ error?: string }>();
  const submit = useSubmit();
  const form = useForm<CustomerCreateValues>({
    resolver: zodResolver(customerCreateSchema),
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

  function onSubmit(values: CustomerCreateValues) {
    submit(values, { method: "post" });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>新建客户</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 py-2">
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
                    <SelectTrigger id="status">
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
          <div className="mt-6 flex gap-3">
            {actionData?.error ? (
              <p className="text-sm text-red-500">{actionData.error}</p>
            ) : null}
            <Button type="submit">创建</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/customers">取消</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
