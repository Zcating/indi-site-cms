import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

interface CustomerParams {
  id: string;
}

interface CustomerQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

interface CreateCustomerBody {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

interface UpdateCustomerBody {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export async function customerRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token;
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      fastify.jwt.verify(token);
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', async (request: FastifyRequest<{ Querystring: CustomerQuery }>, reply: FastifyReply) => {
    const { page = '1', limit = '10', status, search } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    return {
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  });

  fastify.get<{ Params: CustomerParams }>('/:id', async (request: FastifyRequest<{ Params: CustomerParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const customer = await prisma.customer.findUnique({
      where: { id }
    });
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }
    return customer;
  });

  fastify.post<{ Body: CreateCustomerBody }>('/', async (request: FastifyRequest<{ Body: CreateCustomerBody }>, reply: FastifyReply) => {
    const { name, email, phone, company, address, notes, status } = request.body;

    if (!name) {
      return reply.status(400).send({ error: 'Name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        notes,
        status: status || 'ACTIVE'
      }
    });

    return customer;
  });

  fastify.put<{ Params: CustomerParams; Body: UpdateCustomerBody }>('/:id', async (request: FastifyRequest<{ Params: CustomerParams; Body: UpdateCustomerBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { name, email, phone, company, address, notes, status } = request.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (company !== undefined) data.company = company;
    if (address !== undefined) data.address = address;
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) data.status = status;

    const customer = await prisma.customer.update({
      where: { id },
      data
    });

    return customer;
  });

  fastify.delete<{ Params: CustomerParams }>('/:id', async (request: FastifyRequest<{ Params: CustomerParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    await prisma.customer.delete({
      where: { id }
    });
    return { success: true };
  });
}
