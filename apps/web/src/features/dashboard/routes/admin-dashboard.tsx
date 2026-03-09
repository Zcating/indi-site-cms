import { redirect } from "react-router";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Image as ImageIcon, FileText, UserCog } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  try {
    const [users, customers, images, pages] = await Promise.all([
      api.users.list(request),
      api.customers.list({ limit: 1 }, request),
      api.images.list({ limit: 1 }, request),
      api.pages.list({ limit: 1 }, request),
    ]);
    return {
      stats: {
        users: users.length,
        customers: customers.pagination.total,
        images: images.pagination.total,
        pages: pages.pagination.total,
      },
    };
  } catch {
    return {
      stats: {
        users: 0,
        customers: 0,
        images: 0,
        pages: 0,
      },
    };
  }
}

export async function action({ request }: { request: Request }) {
  const result = await api.auth.logout(request);
  const headers = new Headers();
  if (result.setCookie) {
    headers.append("Set-Cookie", result.setCookie);
  }
  throw redirect("/login", { headers });
}

export default function DashboardPage({ loaderData }: { loaderData: { stats: { users: number; customers: number; images: number; pages: number } } }) {
  const { stats } = loaderData;

  const statCards = [
    { title: "用户", value: stats.users, icon: UserCog, color: "text-blue-600" },
    { title: "客户", value: stats.customers, icon: Users, color: "text-green-600" },
    { title: "图片", value: stats.images, icon: ImageIcon, color: "text-purple-600" },
    { title: "页面", value: stats.pages, icon: FileText, color: "text-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
