import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";
import { customersRoutes } from "./features/customers/routes";
import { dashboardRoutes } from "./features/dashboard/routes";
import { pagesRoutes } from "./features/pages/routes";
import { imagesRoutes } from "./features/images/routes";
import { usersRoutes } from "./features/users/routes";
import { authRoutes } from "./features/auth/routes";
import { productsRoutes } from "./features/products/routes";

export default [
  index("routes/_index.tsx"),
  route(authRoutes.login.path, authRoutes.login.module),
  route(authRoutes.register.path, authRoutes.register.module),
  route(":slug", "routes/site.slug.tsx"),
  layout("routes/admin.tsx", [
    route(dashboardRoutes.adminHome.path, dashboardRoutes.adminHome.module),
    route(usersRoutes.usersList.path, usersRoutes.usersList.module),
    route(customersRoutes.customersNew.path, customersRoutes.customersNew.module),
    route(customersRoutes.customersList.path, customersRoutes.customersList.module),
    route(productsRoutes.productsNew.path, productsRoutes.productsNew.module),
    route(productsRoutes.productsList.path, productsRoutes.productsList.module),
    route(imagesRoutes.imagesList.path, imagesRoutes.imagesList.module),
    route(imagesRoutes.imagesUpload.path, imagesRoutes.imagesUpload.module),
    route(pagesRoutes.pagesList.path, pagesRoutes.pagesList.module),
  ]),
] satisfies RouteConfig;
