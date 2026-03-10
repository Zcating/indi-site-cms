import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
import { randomUUID } from 'crypto';

const pump = util.promisify(pipeline);
const UPLOAD_DIR = './uploads';

export async function uploadRoutes(fastify: FastifyInstance) {
  // Ensure upload directory exists
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

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

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (!data.mimetype.startsWith('image/')) {
      return reply.status(400).send({ error: 'Only image files are allowed' });
    }

    const ext = path.extname(data.filename);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
      await pump(data.file, fs.createWriteStream(filepath));
      
      const host = request.headers.host;
      const protocol = request.protocol;
      const url = `/uploads/${filename}`;
      const absoluteUrl = host ? `${protocol}://${host}${url}` : url;

      return { 
        url,
        absoluteUrl 
      };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Upload failed' });
    }
  });
}
