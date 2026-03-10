import { spawn, type ChildProcess } from "node:child_process";
import * as net from "node:net";

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForHttp(url: string, timeoutMs = 60_000): Promise<void> {
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

export async function waitForTcp(host: string, port: number, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const connected = await new Promise<boolean>((resolve) => {
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

export function parseDatabaseAddress(databaseUrl: string): { host: string; port: number } {
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

export interface SpawnOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  shell?: boolean;
  stdio?: "inherit" | "ignore" | "pipe";
}

export function start(command: string, args: string[], options: SpawnOptions = {}): ChildProcess {
  return spawn(command, args, {
    stdio: options.stdio ?? "inherit",
    shell: options.shell ?? true,
    cwd: options.cwd,
    env: options.env,
  });
}

export async function runStep(
  name: string,
  command: string,
  args: string[],
  options: SpawnOptions = {}
): Promise<void> {
  const child = start(command, args, options);
  const code = await new Promise<number>((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) {
    throw new Error(`${name} failed with exit code ${code}`);
  }
}

export async function commandExitCode(
  command: string,
  args: string[],
  options: SpawnOptions = {}
): Promise<number> {
  const child = start(command, args, {
    stdio: "ignore",
    ...options,
  });
  return new Promise<number>((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode ?? 1));
  });
}

export async function waitForPostgresContainer(cwd: string, timeoutMs = 90_000): Promise<void> {
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

export function createSharedEnv(apiPort: number, webPort: number, apiBase: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    E2E_API_PORT: String(apiPort),
    E2E_WEB_PORT: String(webPort),
    INTERNAL_API_BASE: apiBase,
  };
}
