import { useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export async function loader() {
  try {
    const user = await api.auth.me();
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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }

  try {
    await api.auth.login(email, password);
    toast.success("登录成功");
    throw redirect("/admin");
  } catch (error) {
    if (error instanceof Response) throw error;
    return { error: error instanceof Error ? error.message : "登录失败" };
  }
}

export default function LoginPage({ actionData }: { actionData?: { error?: string } }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
          <CardDescription>输入您的账号和密码登录系统</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {actionData?.error && (
              <p className="text-sm text-red-500">{actionData.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </Form>
          <p className="mt-4 text-center text-sm text-gray-600">
            还没有账号?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
