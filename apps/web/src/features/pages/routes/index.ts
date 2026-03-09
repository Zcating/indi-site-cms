export const pagesRoutes = {
  pagesList: {
    path: "admin/pages",
    module: "features/pages/routes/pages-list-route.tsx",
  },
  mimooHome: {
    path: "mimoo",
    module: "features/pages/routes/indi-home-route.tsx",
  },
} as const;
