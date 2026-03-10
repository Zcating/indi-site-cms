import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { customerRoutes } from './routes/customers.js';
import { imageRoutes } from './routes/images.js';
import { pageRoutes } from './routes/pages.js';
import { productRoutes } from './routes/products.js';
import { uploadRoutes } from './routes/upload.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

export const prisma = new PrismaClient({ adapter });

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

await fastify.register(cookie);

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  cookie: {
    cookieName: 'token',
    signed: false
  }
});

fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies.token;
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = fastify.jwt.verify(token);
    request.user = decoded;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/'
});

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(customerRoutes, { prefix: '/api/customers' });
await fastify.register(imageRoutes, { prefix: '/api/images' });
await fastify.register(pageRoutes, { prefix: '/api/pages' });
await fastify.register(productRoutes, { prefix: '/api/products' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
