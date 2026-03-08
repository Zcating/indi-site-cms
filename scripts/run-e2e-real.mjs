import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import net from "node:net";
import { fileURLToPath } from "node:url";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDatabaseAddress(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname || "localhost",
      port: Number(url.port || 5432),
    };
  } catch {
    return { host: "localhost", port: 5432 };
  }
}

async function waitForTcp(host, port, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const connected = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2_000);
      socket
        .once("connect", () => {
          socket.destroy();
          resolve(true);
        })
        .once("timeout", () => {
          socket.destroy();
          resolve(false);
        })
        .once("error", () => resolve(false))
        .connect(port, host);
    });

    if (connected) return;
    await wait(500);
  }

  throw new Error(`Timed out waiting for TCP ${host}:${port}`);
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
  return spawn(command, args, {
    stdio: "inherit",
    shell: true,
    ...options,
  });
}

async function runStep(name, command, args, options = {}) {
  const child = start(command, args, options);
  const code = await new Promise((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) {
    throw new Error(`${name} failed with exit code ${code}`);
  }
}

async function commandExitCode(command, args, options = {}) {
  const child = start(command, args, {
    stdio: "ignore",
    ...options,
  });
  return new Promise((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode ?? 1));
  });
}

async function waitForPostgresContainer(cwd, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const code = await commandExitCode(
      "docker",
      ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "postgres", "-d", "indi_site_cms"],
      { cwd }
    );

    if (code === 0) return;
    await wait(1000);
  }

  throw new Error("Timed out waiting for postgres container health");
}

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const pnpmBin = "pnpm";

const apiPort = Number(process.env.E2E_API_PORT || randomInt(3100, 3999));
const webPort = Number(process.env.E2E_WEB_PORT || randomInt(4100, 4999));
const databaseUrl =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/indi_site_cms?schema=public";
const apiBase = `http://localhost:${apiPort}/api`;
const webBase = `http://localhost:${webPort}`;

const sharedEnv = {
  ...process.env,
  E2E_API_PORT: String(apiPort),
  E2E_WEB_PORT: String(webPort),
  INTERNAL_API_BASE: apiBase,
  DATABASE_URL: databaseUrl,
  PORT: String(apiPort),
};

const { host: dbHost, port: dbPort } = parseDatabaseAddress(databaseUrl);
const startedChildren = [];
let cleaningUp = false;

async function cleanupDatabase() {
  await runStep(
    "Cleanup DB reset",
    pnpmBin,
    ["--filter", "server", "exec", "prisma", "db", "push", "--force-reset", "--accept-data-loss", "--url", databaseUrl],
    { env: sharedEnv }
  );
}

async function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;

  for (const child of startedChildren) {
    if (!child.killed) child.kill();
  }

  try {
    await cleanupDatabase();
  } catch (error) {
    console.error("[cleanup] 数据库清理失败：", error);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await cleanup();
    process.exit(1);
  });
}

let exitCode = 0;
try {
  console.log("[e2e-real] 启动 postgres 容器...");
  await runStep("docker compose up", "docker", ["compose", "up", "-d", "postgres"], { cwd: rootDir });

  console.log("[e2e-real] 等待 postgres 健康检查...");
  await waitForPostgresContainer(rootDir, 90_000);

  console.log("[e2e-real] 等待数据库端口...");
  await waitForTcp(dbHost, dbPort, 90_000);

  console.log("[e2e-real] 生成 Prisma Client...");
  await runStep("Prisma generate", pnpmBin, ["--filter", "server", "run", "db:generate"], { env: sharedEnv });

  console.log("[e2e-real] 迁移数据库结构（prisma db push）...");
  await runStep(
    "Prisma db push migrate",
    pnpmBin,
    ["--filter", "server", "exec", "prisma", "db", "push", "--accept-data-loss", "--url", databaseUrl],
    { env: sharedEnv }
  );

  console.log("[e2e-real] 重置并同步数据库（prisma db push --force-reset）...");
  await runStep(
    "Prisma db push reset",
    pnpmBin,
    ["--filter", "server", "exec", "prisma", "db", "push", "--force-reset", "--accept-data-loss", "--url", databaseUrl],
    { env: sharedEnv }
  );

  console.log("[e2e-real] 启动后端服务...");
  const server = start(pnpmBin, ["--filter", "server", "exec", "tsx", "src/index.ts"], { env: sharedEnv });
  startedChildren.push(server);

  console.log("[e2e-real] 启动前端服务...");
  const web = start(
    pnpmBin,
    ["--filter", "web", "exec", "vite", "--port", String(webPort), "--strictPort"],
    { env: sharedEnv }
  );
  startedChildren.push(web);

  await waitForHttp(`${apiBase}/health`, 60_000);
  await waitForHttp(`${webBase}/login`, 90_000);

  console.log("[e2e-real] 运行 Playwright...");
  await runStep("Playwright test", pnpmBin, ["exec", "playwright", "test", "--reporter=list"], {
    env: {
      ...sharedEnv,
      PW_NO_WEBSERVER: "1",
    },
  });
} catch (error) {
  console.error("[e2e-real] 执行失败：", error);
  exitCode = 1;
} finally {
  await cleanup();
}

process.exit(exitCode);
