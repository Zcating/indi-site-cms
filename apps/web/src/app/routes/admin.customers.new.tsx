import { Form, Link, redirect } from "react-router";
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

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;
  const address = formData.get("address") as string;
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as string;

  await api.customers.create({ name, email, phone, company, address, notes, status }, request);
  return redirect("/admin/customers");
}

export default function NewCustomerPage() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>新建客户</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post">
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">公司</Label>
              <Input id="company" name="company" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">地址</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger id="status">
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
              <Input id="notes" name="notes" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
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
