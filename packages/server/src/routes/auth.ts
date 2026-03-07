import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../index.js';
import bcrypt from 'bcrypt';

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginBody }>('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  });

  fastify.post<{ Body: RegisterBody }>('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password, name } = request.body;

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
        role: 'ADMIN'
      }
    });

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  });

  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token', {
      path: '/'
    });
    return { success: true };
  });

  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token;
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const decoded = fastify.jwt.verify<{ id: string }>(token);
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      return dbUser;
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}
