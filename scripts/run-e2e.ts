import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { ChildProcess } from "node:child_process";
import {
  waitForHttp,
  start,
  createSharedEnv,
  type SpawnOptions,
} from "./utils.js";

const pnpmBin = "pnpm";

const apiPort = Number(process.env.E2E_API_PORT || randomInt(3100, 3999));
const webPort = Number(process.env.E2E_WEB_PORT || randomInt(4100, 4999));
const apiBase = `http://localhost:${apiPort}/api`;
const webBase = `http://localhost:${webPort}`;

const sharedEnv = createSharedEnv(apiPort, webPort, apiBase);

const mockApi = start("node", ["apps/web/e2e/mock-api-server.mjs"], {
  env: {
    ...sharedEnv,
    MOCK_API_PORT: String(apiPort),
    MOCK_WEB_ORIGIN: webBase,
  },
});

const web = start(pnpmBin, ["--filter", "web", "exec", "vite", "--port", String(webPort), "--strictPort"], {
  env: sharedEnv,
});

let exitCode = 0;
try {
  await waitForHttp(`${apiBase}/health`, 30_000);
  await waitForHttp(`${webBase}/login`, 60_000);

  const testRunner = start(
    pnpmBin,
    ["exec", "playwright", "test", "--reporter=list", ...process.argv.slice(2)],
    {
      env: {
        ...process.env,
        ...sharedEnv,
        PW_NO_WEBSERVER: "1",
      },
    }
  );

  exitCode = await new Promise<number>((resolve) => {
    testRunner.on("close", (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  mockApi.kill();
  web.kill();
}

process.exit(exitCode);
