import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../index.js';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

interface ImageParams {
  id: string;
}

interface ImageQuery {
  page?: string;
  limit?: string;
  category?: string;
  search?: string;
}

const UPLOAD_DIR = './uploads';

export async function imageRoutes(fastify: FastifyInstance) {
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

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  fastify.get('/', async (request: FastifyRequest<{ Querystring: ImageQuery }>, reply: FastifyReply) => {
    const { page = '1', limit = '20', category, search } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.image.count({ where })
    ]);

    return {
      data: images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  });

  fastify.get<{ Params: ImageParams }>('/:id', async (request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    const image = await prisma.image.findUnique({
      where: { id }
    });
    if (!image) {
      return reply.status(404).send({ error: 'Image not found' });
    }
    return image;
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const filename = `${randomUUID()}${path.extname(data.filename)}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = await data.toBuffer();
    await fs.writeFile(filepath, buffer);
    const metadata = await getImageMetadata(buffer);

    const { title, alt, category, tags } = request.body as any;

    const image = await prisma.image.create({
      data: {
        title: title || data.filename,
        filename,
        url: `/uploads/${filename}`,
        mimeType: data.mimetype,
        size: buffer.length,
        width: metadata.width,
        height: metadata.height,
        alt: alt || '',
        category: category || null,
        tags: tags ? JSON.parse(tags) : []
      }
    });

    const host = request.headers.host;
    const absoluteUrl = host ? `${request.protocol}://${host}${image.url}` : image.url;

    return {
      ...image,
      absoluteUrl,
    };
  });

  fastify.delete<{ Params: ImageParams }>('/:id', async (request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const image = await prisma.image.findUnique({
      where: { id }
    });

    if (!image) {
      return reply.status(404).send({ error: 'Image not found' });
    }

    const filepath = path.join(UPLOAD_DIR, image.filename);
    try {
      await fs.unlink(filepath);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }

    await prisma.image.delete({
      where: { id }
    });

    return { success: true };
  });
}

async function getImageMetadata(buffer: Buffer): Promise<{ width?: number; height?: number }> {
  try {
    const arr = new Uint8Array(buffer.slice(0, 24));
    const isPng = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47;
    const isJpeg = arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF;

    if (isPng) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (isJpeg) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    return {};
  } catch {
    return {};
  }
}
