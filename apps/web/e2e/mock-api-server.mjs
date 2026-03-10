import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_API_PORT || 3001);
const ALLOWED_ORIGIN = process.env.MOCK_WEB_ORIGIN || "http://localhost:4173";

const users = new Map();
const products = new Map();
const images = new Map();
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

function readMultipartBody(req, contentType) {
  return new Promise((resolve, reject) => {
    const boundaryMatch = contentType.match(/boundary=(.+)/i);
    const boundary = boundaryMatch ? boundaryMatch[1] : null;
    if (!boundary) {
      return reject(new Error("No boundary"));
    }

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const result = {};

        let start = 0;
        while (true) {
          const boundaryIndex = bodyBuffer.indexOf(boundaryBuffer, start);
          if (boundaryIndex === -1) break;

          const partStart = boundaryIndex + boundaryBuffer.length;
          const partEnd = bodyBuffer.indexOf(Buffer.from("\r\n--"), partStart);
          if (partEnd === -1) break;

          const partData = bodyBuffer.slice(partStart, partEnd);
          const headerEndIndex = partData.indexOf(Buffer.from("\r\n\r\n"));
          if (headerEndIndex === -1) {
            start = partEnd;
            continue;
          }

          const headerPart = partData.slice(0, headerEndIndex).toString("utf-8");
          const fileData = partData.slice(headerEndIndex + 4);

          const nameMatch = headerPart.match(/name="([^"]+)"/);
          const filenameMatch = headerPart.match(/filename="([^"]+)"/);
          const mimeMatch = headerPart.match(/Content-Type:\s*([^\r\n]+)/i);

          if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
              result[name] = {
                filename: filenameMatch[1],
                content: fileData.toString("base64"),
                mimeType: mimeMatch ? mimeMatch[1] : "application/octet-stream",
              };
            } else {
              result[name] = fileData.toString("utf-8").replace(/\r\n$/, "");
            }
          }

          start = partEnd;
        }
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  console.log(`[mock-api] ${req.method} ${req.url} from ${req.headers.origin}`);
  if (!req.url) {
    return json(res, 400, { error: "Bad request" });
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Origin, X-Requested-With",
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
    const allImages = Array.from(images.values());
    const search = url.searchParams.get("search");
    let filtered = allImages;
    if (search) {
      filtered = allImages.filter((img) => img.title.toLowerCase().includes(search.toLowerCase()));
    }
    return json(res, 200, {
      data: filtered,
      pagination: { page: 1, limit: 10, total: filtered.length, totalPages: Math.ceil(filtered.length / 10) },
    });
  }

  if (path === "/api/images" && req.method === "POST") {
    console.log("[mock-api] Received POST /api/images");
    const contentType = req.headers["content-type"] || "";
    console.log("[mock-api] Content-Type:", contentType);
    if (!contentType.includes("multipart/form-data")) {
      return json(res, 400, { error: "Content-Type must be multipart/form-data" });
    }

    try {
      const body = await readMultipartBody(req, contentType);
      console.log("[mock-api] Parsed body keys:", Object.keys(body));
      if (!body.file) {
        return json(res, 400, { error: "No file uploaded" });
      }

      const file = body.file;
      const id = randomUUID();
      const filename = file.filename || `image-${id}.png`;
      const contentBuffer = Buffer.from(file.content, "base64");
      const image = {
        id,
        title: body.title || filename.replace(/\.[^/.]+$/, ""),
        filename,
        url: `/uploads/${filename}`,
        absoluteUrl: `http://localhost:${PORT}/uploads/${filename}`,
        mimeType: file.mimeType || "image/png",
        size: contentBuffer.length,
        alt: body.alt || "",
        category: body.category || "",
        tags: body.tags ? JSON.parse(body.tags) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      images.set(id, image);
      return json(res, 201, image);
    } catch (err) {
      console.error("[mock-api] Upload error:", err);
      return json(res, 500, { error: "Upload failed" });
    }
  }

  if (path === "/api/pages" && req.method === "GET") {
    return json(res, 200, { data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } });
  }

  return json(res, 404, { error: `Not found: ${req.method} ${path}` });
});

console.log("[mock-api] All routes defined, starting server...");

server.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`);
});
