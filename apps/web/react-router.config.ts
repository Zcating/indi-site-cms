import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  appDirectory: "src/app",
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
