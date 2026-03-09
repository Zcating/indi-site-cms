import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_API_PORT || 3001);
const ALLOWED_ORIGIN = process.env.MOCK_WEB_ORIGIN || "http://localhost:4173";

const users = new Map();
const products = new Map();
let activeUserEmail = null;

function json(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    ...extraHeaders,
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data ? JSON.parse(data) : {}));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    return json(res, 400, { error: "Bad request" });
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const currentUser = activeUserEmail ? users.get(activeUserEmail) : undefined;

  if (path === "/api/health" && req.method === "GET") {
    return json(res, 200, { status: "ok" });
  }

  if (path === "/api/auth/register" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.email || !body.password) {
      return json(res, 400, { error: "Email and password are required" });
    }
    if (users.has(body.email)) {
      return json(res, 400, { error: "Email already exists" });
    }
    const user = {
      id: randomUUID(),
      email: body.email,
      password: body.password,
      name: body.name || body.email.split("@")[0],
      role: body.role === "USER" ? "USER" : "ADMIN",
    };
    users.set(user.email, user);
    activeUserEmail = user.email;
    return json(res, 200, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  if (path === "/api/auth/login" && req.method === "POST") {
    const body = await readBody(req);
    const user = users.get(body.email || "");
    if (!user || user.password !== body.password) {
      return json(res, 401, { error: "Invalid credentials" });
    }
    activeUserEmail = user.email;
    return json(res, 200, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  if (path === "/api/auth/logout" && req.method === "POST") {
    activeUserEmail = null;
    return json(res, 200, { success: true });
  }

  if (path === "/api/auth/me" && req.method === "GET") {
    if (!currentUser) {
      return json(res, 401, { error: "Unauthorized" });
    }
    return json(res, 200, {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      createdAt: new Date().toISOString(),
    });
  }

  if (!currentUser) {
    return json(res, 401, { error: "Unauthorized" });
  }

  if (path === "/api/users" && req.method === "GET") {
    return json(res, 200, [
      {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
      },
    ]);
  }

  if (path === "/api/users" && req.method === "POST") {
    if (currentUser.role !== "ADMIN") {
      return json(res, 403, { error: "Forbidden" });
    }
    const body = await readBody(req);
    if (!body.email || !body.password) {
      return json(res, 400, { error: "Email and password are required" });
    }
    if (users.has(body.email)) {
      return json(res, 400, { error: "Email already exists" });
    }
    const user = {
      id: randomUUID(),
      email: body.email,
      password: body.password,
      name: body.name || body.email.split("@")[0],
      role: body.role === "ADMIN" ? "ADMIN" : "USER",
    };
    users.set(user.email, user);
    return json(res, 200, { id: user.id, email: user.email, name: user.name, role: user.role });
  }

  if (path === "/api/customers" && req.method === "GET") {
    return json(res, 200, { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  }

  // Products API
  if (path === "/api/products" && req.method === "GET") {
    const allProducts = Array.from(products.values());
    return json(res, 200, {
      data: allProducts,
      pagination: {
        page: 1,
        limit: 10,
        total: allProducts.length,
        totalPages: Math.ceil(allProducts.length / 10),
      },
    });
  }

  if (path === "/api/products" && req.method === "POST") {
    const body = await readBody(req);
    const product = {
      id: randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.set(product.id, product);
    return json(res, 201, product);
  }

  // Match /api/products/:id
  const productMatch = path.match(/^\/api\/products\/([\w-]+)$/);
  if (productMatch) {
    const productId = productMatch[1];

    if (req.method === "GET") {
      const product = products.get(productId);
      if (!product) return json(res, 404, { error: "Product not found" });
      return json(res, 200, product);
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      const existing = products.get(productId);
      if (!existing) return json(res, 404, { error: "Product not found" });
      const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
      products.set(productId, updated);
      return json(res, 200, updated);
    }

    if (req.method === "DELETE") {
      if (!products.has(productId)) return json(res, 404, { error: "Product not found" });
      products.delete(productId);
      return json(res, 200, { success: true });
    }
  }

  if (path === "/api/images" && req.method === "GET") {
    return json(res, 200, { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } });
  }

  if (path === "/api/pages" && req.method === "GET") {
    return json(res, 200, { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } });
  }

  return json(res, 404, { error: `Not found: ${req.method} ${path}` });
});

server.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`);
});
