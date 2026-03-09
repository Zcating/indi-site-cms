export const authRoutes = {
  login: {
    path: "login",
    module: "features/auth/routes/login-route.tsx",
  },
  register: {
    path: "register",
    module: "features/auth/routes/register-route.tsx",
  },
} as const;

export { default as LoginRoute } from "./login-route";
export { action as loginAction, loader as loginLoader } from "./login-route";
export { default as RegisterRoute } from "./register-route";
export { action as registerAction, loader as registerLoader } from "./register-route";
