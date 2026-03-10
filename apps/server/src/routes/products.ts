import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const productStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);

const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: productStatusSchema.optional(),
  search: z.string().trim().min(1).optional()
});

const productParamsSchema = z.object({
  id: z.string().cuid()
});

const createProductBodySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  imageUrl: z.string().trim().nullable().optional(),
  status: productStatusSchema.optional()
});

const updateProductBodySchema = createProductBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

function sendZodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: 'Validation failed',
    details: error.flatten()
  });
}

export async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.token;
      if (!token) {
        // Allow GET requests without authentication if needed, or enforce strict auth
        // For admin panel, we likely want strict auth.
        // If this hook applies to all routes, we need to handle public access if any.
        // Currently all product routes seem protected.
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      await fastify.jwt.verify(token);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedQuery = productListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return sendZodError(reply, parsedQuery.error);
    }

    const { page, limit, status, search } = parsedQuery.data;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedParams = productParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return sendZodError(reply, parsedParams.error);
    }

    const { id } = parsedParams.data;
    const product = await prisma.product.findUnique({
      where: { id }
    });
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    return product;
  });

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedBody = createProductBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return sendZodError(reply, parsedBody.error);
    }

    const { name, slug: providedSlug, description, status, imageUrl } = parsedBody.data;

    let slug = providedSlug;
    if (!slug) {
      slug = generateSlug(name);
      // Ensure uniqueness if auto-generated
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const existingProduct = await prisma.product.findUnique({ where: { slug } });
    if (existingProduct) {
      return reply.status(400).send({ error: 'Slug already exists' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        status: status ?? 'DRAFT',
        imageUrl
      }
    });

    return product;
  });

  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedParams = productParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return sendZodError(reply, parsedParams.error);
    }

    const parsedBody = updateProductBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return sendZodError(reply, parsedBody.error);
    }

    const { id } = parsedParams.data;
    const { slug, imageUrl } = parsedBody.data;

    if (slug) {
      const existingProduct = await prisma.product.findFirst({
        where: { slug, NOT: { id } }
      });
      if (existingProduct) {
        return reply.status(400).send({ error: 'Slug already exists' });
      }
    }

    const data: Prisma.ProductUpdateInput = {};
    if (parsedBody.data.name !== undefined) data.name = parsedBody.data.name;
    if (parsedBody.data.slug !== undefined) data.slug = parsedBody.data.slug;
    if (parsedBody.data.description !== undefined) data.description = parsedBody.data.description;
    if (parsedBody.data.status !== undefined) data.status = parsedBody.data.status;
    if (parsedBody.data.imageUrl !== undefined) data.imageUrl = parsedBody.data.imageUrl;

    try {
      const product = await prisma.product.update({
        where: { id },
        data
      });
      return product;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return reply.status(404).send({ error: 'Product not found' });
      }
      throw error;
    }
  });

  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedParams = productParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return sendZodError(reply, parsedParams.error);
    }

    const { id } = parsedParams.data;
    try {
      await prisma.product.delete({ where: { id } });
      return { success: true };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return reply.status(404).send({ error: 'Product not found' });
      }
      throw error;
    }
  });
}
