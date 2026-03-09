import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";
import { customersRoutes } from "./features/customers/routes";
import { pagesRoutes } from "./features/pages/routes";
import { imagesRoutes } from "./features/images/routes";
import { usersRoutes } from "./features/users/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route(":slug", "routes/site.slug.tsx"),
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route(usersRoutes.usersList.path, usersRoutes.usersList.module),
    route(customersRoutes.customersNew.path, customersRoutes.customersNew.module),
    route(customersRoutes.customersList.path, customersRoutes.customersList.module),
    route(imagesRoutes.imagesList.path, imagesRoutes.imagesList.module),
    route(imagesRoutes.imagesUpload.path, imagesRoutes.imagesUpload.module),
    route(pagesRoutes.pagesList.path, pagesRoutes.pagesList.module),
  ]),
] satisfies RouteConfig;
