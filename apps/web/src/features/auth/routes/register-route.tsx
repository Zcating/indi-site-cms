import { Form, Link, redirect, useNavigation, useSubmit } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const registerFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export async function loader({ request }: { request: Request }) {
  try {
    const user = await api.auth.me(request);
    if (user) {
      throw redirect("/admin");
    }
  } catch {
    return { user: null };
  }
  return { user: null };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const parsed = registerFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "请填写邮箱和密码" };
  }

  try {
    const { name, email, password } = parsed.data;
    const result = await api.auth.register(email, password, name, request);
    toast.success("注册成功");
    const headers = new Headers();
    if (result.setCookie) {
      headers.append("Set-Cookie", result.setCookie);
    }
    throw redirect("/admin", { headers });
  } catch (error) {
    if (error instanceof Response) throw error;
    return { error: error instanceof Error ? error.message : "注册失败" };
  }
}

export default function RegisterPage({ actionData }: { actionData?: { error?: string } }) {
  const navigation = useNavigation();
  const submit = useSubmit();
  const isLoading = navigation.state === "submitting";
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    submit(values, { method: "post" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">注册</CardTitle>
          <CardDescription>创建一个新账号</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                placeholder="您的名字"
                {...form.register("name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            {actionData?.error && (
              <p className="text-sm text-red-500">{actionData.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </Form>
          <p className="mt-4 text-center text-sm text-gray-600">
            已有账号?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
