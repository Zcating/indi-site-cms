import { Link, Outlet, useLocation, redirect } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Image as ImageIcon, FileText, LogOut, ChevronRight, Package } from "lucide-react";

const navigation = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "用户管理", href: "/admin/users", icon: Users },
  { name: "客户管理", href: "/admin/customers", icon: Users },
  { name: "产品管理", href: "/admin/products", icon: Package },
  { name: "图片管理", href: "/admin/images", icon: ImageIcon },
  { name: "官网管理", href: "/admin/pages", icon: FileText },
];

const breadcrumbPathLabels: Record<string, string> = {
  "/admin/customers/new": "新建客户",
  "/admin/products/new": "新建产品",
  "/admin/images/upload": "上传图片",
};

const adminActionSchema = z.object({
  intent: z.literal("logout"),
});

export async function loader({ request }: { request: Request }) {
  try {
    const user = await api.auth.me(request);
    return { user };
  } catch {
    throw redirect("/login");
  }
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const parsed = adminActionSchema.safeParse({
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return { error: "未知操作" };
  }

  const result = await api.auth.logout(request);
  const headers = new Headers();
  if (result.setCookie) {
    headers.append("Set-Cookie", result.setCookie);
  }
  throw redirect("/login", { headers });
}

export default function AdminLayout({ loaderData }: { loaderData: { user: { name?: string; email: string; role: string } } }) {
  const { user } = loaderData;
  const logoutForm = useForm<z.infer<typeof adminActionSchema>>({
    resolver: zodResolver(adminActionSchema),
    defaultValues: {
      intent: "logout",
    },
  });
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments
    .map((_, index) => `/${pathSegments.slice(0, index + 1).join("/")}`)
    .filter((path) => path.startsWith("/admin"))
    .map((path) => {
      const matchedNavigation = navigation.find((item) => item.href === path);
      return {
        href: path,
        name: matchedNavigation?.name || breadcrumbPathLabels[path] || decodeURIComponent(path.split("/").pop() || ""),
      };
    });

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-r">
        <div className="flex flex-1 min-h-0 flex-col">
          <SidebarHeader className="mb-2">
            <h1 className="text-xl font-bold text-gray-900">INDI CMS</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== "/admin" && location.pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton render={<Link to={item.href} />} isActive={isActive}>
                        <item.icon className="mr-3 h-5 w-5 shrink-0" />
                        {item.name}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.name || user?.email}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.role}</p>
              </div>
              <form method="post" action="/admin">
                <input type="hidden" value="logout" {...logoutForm.register("intent")} />
                <Button variant="ghost" size="icon" type="submit" aria-label="退出登录" data-testid="logout-button">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarInset>
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <SidebarTrigger className="-m-2.5 p-2.5 text-gray-700" />
          <div className="h-6 w-px bg-gray-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <nav aria-label="面包屑">
                <ol className="flex items-center text-sm text-gray-500">
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <li key={item.href} className="flex items-center">
                        {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}
                        {isLast ? (
                          <span className="font-medium text-gray-900">{item.name}</span>
                        ) : (
                          <Link to={item.href} className="hover:text-gray-700">
                            {item.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <span className="hidden text-sm font-medium text-gray-900 lg:block">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
