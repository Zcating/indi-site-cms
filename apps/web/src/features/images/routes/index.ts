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

export { default as ImagesListRoute } from "./images-list-route";
export { action as imagesListAction, loader as imagesListLoader } from "./images-list-route";
export { default as ImagesUploadRoute } from "./images-upload-route";
export { action as imagesUploadAction } from "./images-upload-route";
