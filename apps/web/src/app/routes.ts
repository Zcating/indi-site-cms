import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/customers", "routes/admin.customers.tsx"),
    route("admin/images", "routes/admin.images.tsx"),
    route("admin/pages", "routes/admin.pages.tsx"),
  ]),
] satisfies RouteConfig;
