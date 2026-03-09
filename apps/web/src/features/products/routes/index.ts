export const productsRoutes = {
  productsNew: {
    path: "admin/products/new",
    module: "features/products/routes/products-new-route.tsx",
  },
  productsList: {
    path: "admin/products",
    module: "features/products/routes/products-list-route.tsx",
  },
} as const;
