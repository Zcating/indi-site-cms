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