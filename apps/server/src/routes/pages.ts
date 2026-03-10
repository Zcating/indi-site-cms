import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

interface PageParams {
  id: string;
}

interface PageQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

interface CreatePageBody {
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface UpdatePageBody {
  slug?: string;
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildStaticHtml(page: { title: string; content?: string | null; metaTitle?: string | null; metaDescription?: string | null }) {
  const title = page.metaTitle?.trim() || page.title;
  const description = page.metaDescription?.trim() || '';
  const bodyContent = page.content || '';

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
</head>
<body>
${bodyContent}
</body>
</html>`;
}

export async function pageRoutes(fastify: FastifyInstance) {
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

  fastify.get('/', async (request: FastifyRequest<{ Querystring: PageQuery }>, reply: FastifyReply) => {
    const { page = '1', limit = '10', status, search } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.page.count({ where })
    ]);

    return {
      data: pages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  });

  fastify.get('/slug/:slug', async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const page = await prisma.page.findUnique({
      where: { slug }
    });
    if (!page) {
      return reply.status(404).send({ error: 'Page not found' });
    }
    return page;
  });

  fastify.get<{ Params: PageParams }>('/:id', async (request: FastifyRequest<{ Params: PageParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const page = await prisma.page.findUnique({
      where: { id }
    });
    if (!page) {
      return reply.status(404).send({ error: 'Page not found' });
    }
    return page;
  });

  fastify.get<{ Params: PageParams }>('/:id/export-html', async (request: FastifyRequest<{ Params: PageParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const page = await prisma.page.findUnique({
      where: { id }
    });
    if (!page) {
      return reply.status(404).send({ error: 'Page not found' });
    }

    const html = buildStaticHtml(page);
    reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${page.slug}.html"`)
      .send(html);
  });

  fastify.post<{ Body: CreatePageBody }>('/', async (request: FastifyRequest<{ Body: CreatePageBody }>, reply: FastifyReply) => {
    const { slug, title, content, metaTitle, metaDescription, status } = request.body;

    if (!slug || !title) {
      return reply.status(400).send({ error: 'Slug and title are required' });
    }

    const existingPage = await prisma.page.findUnique({
      where: { slug }
    });

    if (existingPage) {
      return reply.status(400).send({ error: 'Slug already exists' });
    }

    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content: content || '',
        metaTitle,
        metaDescription,
        status: status || 'DRAFT'
      }
    });

    return page;
  });

  fastify.put<{ Params: PageParams; Body: UpdatePageBody }>('/:id', async (request: FastifyRequest<{ Params: PageParams; Body: UpdatePageBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { slug, title, content, metaTitle, metaDescription, status } = request.body;

    if (slug) {
      const existingPage = await prisma.page.findFirst({
        where: { slug, NOT: { id } }
      });
      if (existingPage) {
        return reply.status(400).send({ error: 'Slug already exists' });
      }
    }

    const data: any = {};
    if (slug !== undefined) data.slug = slug;
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (metaTitle !== undefined) data.metaTitle = metaTitle;
    if (metaDescription !== undefined) data.metaDescription = metaDescription;
    if (status !== undefined) data.status = status;

    const page = await prisma.page.update({
      where: { id },
      data
    });

    return page;
  });

  fastify.delete<{ Params: PageParams }>('/:id', async (request: FastifyRequest<{ Params: PageParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    await prisma.page.delete({
      where: { id }
    });
    return { success: true };
  });
}
