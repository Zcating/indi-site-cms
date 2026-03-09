export const customersRoutes = {
  customersNew: {
    path: "admin/customers/new",
    module: "features/customers/routes/customers-new-route.tsx",
  },
  customersList: {
    path: "admin/customers",
    module: "features/customers/routes/customers-list-route.tsx",
  },
} as const;
