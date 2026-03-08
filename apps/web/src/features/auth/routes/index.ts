export const authRoutes = {
  login: {
    path: "login",
    module: "routes/login.tsx",
  },
  register: {
    path: "register",
    module: "routes/register.tsx",
  },
} as const;
