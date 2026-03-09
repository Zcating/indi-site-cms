export const imagesRoutes = {
  imagesList: {
    path: "admin/images",
    module: "features/images/routes/images-list-route.tsx",
  },
  imagesUpload: {
    path: "admin/images/upload",
    module: "features/images/routes/images-upload-route.tsx",
  },
} as const;

