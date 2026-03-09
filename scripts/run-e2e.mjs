import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await wait(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    ...options,
  });
  return child;
}
const pnpmBin = "pnpm";

const apiPort = Number(process.env.E2E_API_PORT || randomInt(3100, 3999));
const webPort = Number(process.env.E2E_WEB_PORT || randomInt(4100, 4999));
const apiBase = `http://localhost:${apiPort}/api`;
const webBase = `http://localhost:${webPort}`;

const sharedEnv = {
  ...process.env,
  E2E_API_PORT: String(apiPort),
  E2E_WEB_PORT: String(webPort),
  INTERNAL_API_BASE: apiBase,
};

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

  exitCode = await new Promise((resolve) => {
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
