import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

interface UserParams {
  id: string;
}

interface CreateUserBody {
  email: string;
  password: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
}

interface UpdateUserBody {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
  password?: string;
}

export async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token;
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const decoded = fastify.jwt.verify(token);
      request.user = decoded;
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return users;
  });

  fastify.get<{ Params: UserParams }>('/:id', async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return user;
  });

  fastify.post<{ Body: CreateUserBody }>('/', async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
    const currentUser = request.user as { id: string; role: 'ADMIN' | 'USER' };
    if (currentUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { email, password, name, role } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return reply.status(400).send({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: role || 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return user;
  });

  fastify.put<{ Params: UserParams; Body: UpdateUserBody }>('/:id', async (request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { email, name, role, password } = request.body;

    const data: any = {};
    if (email) data.email = email;
    if (name) data.name = name;
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });

    return user;
  });

  fastify.delete<{ Params: UserParams }>('/:id', async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const currentUser = request.user as { id: string; role: string };
    if (currentUser.id === id) {
      return reply.status(400).send({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({
      where: { id }
    });

    return { success: true };
  });
}
