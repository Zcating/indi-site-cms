import { Link, Outlet, useLocation, redirect } from "react-router";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Image as ImageIcon, FileText, LogOut, Menu } from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "用户管理", href: "/admin/users", icon: Users },
  { name: "客户管理", href: "/admin/customers", icon: Users },
  { name: "图片管理", href: "/admin/images", icon: ImageIcon },
  { name: "官网管理", href: "/admin/pages", icon: FileText },
];

export async function loader({ request }: { request: Request }) {
  try {
    const user = await api.auth.me(request);
    return { user };
  } catch {
    throw redirect("/login");
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

export default function AdminLayout({ loaderData }: { loaderData: { user: { name?: string; email: string; role: string } } }) {
  const { user } = loaderData;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="fixed inset-0 z-40 lg:hidden"
        style={{ display: sidebarOpen ? "block" : "none" }}
      >
        <div
          className="fixed inset-0 bg-gray-600/75"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r">
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            <div className="px-6 mb-6">
              <h1 className="text-xl font-bold text-gray-900">INDIA CMS</h1>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/admin" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="flex-shrink-0 w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
              <form method="post" action="/admin">
                <Button variant="ghost" size="icon" type="submit" aria-label="退出登录" data-testid="logout-button">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="w-6 h-6" />
          </button>
          <div className="h-6 w-px bg-gray-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
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
      </div>
    </div>
  );
}
