import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import type { Collection } from '../../generated/prisma/client';
import { CollectionsModule } from './collections.module';
import type { CollectionResponse } from './dto/collection.response';

// jwks-rsa is mocked so token verification runs against a fixed test public key
// instead of fetching from a live JWKS endpoint.
let mockPublicKey = '';
let mockPrivateKey = '';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(
    () =>
      (
        _req: unknown,
        _token: unknown,
        done: (err: Error | null, secret?: string) => void,
      ): void => {
        done(null, mockPublicKey);
      },
  ),
}));

// ConfigModule reads from the process environment (dotenv does not override
// existing process.env values), so seed the Auth0 config before bootstrapping.
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'test-audience';

function signToken(sub: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      sub,
      iss: 'https://test.auth0.com/',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  signer.end();
  const signature = signer.sign(mockPrivateKey).toString('base64url');
  return `${header}.${body}.${signature}`;
}

/** Helper: extract typed body from a supertest response */
function body<T>(res: { body: unknown }): T {
  return res.body as T;
}

describe('CollectionsController', () => {
  let app: INestApplication<App>;

  const userOneId = 'auth0|user-1';
  const userTwoId = 'auth0|user-2';

  const col1: Collection = {
    id: 'col-1',
    name: 'Tech Bookmarks',
    ownerId: userOneId,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const col2: Collection = {
    id: 'col-2',
    name: 'Design Links',
    ownerId: userOneId,
    createdAt: new Date('2025-01-02T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  const colOtherUser: Collection = {
    id: 'col-other',
    name: 'Other User Collection',
    ownerId: userTwoId,
    createdAt: new Date('2025-01-03T00:00:00.000Z'),
    updatedAt: new Date('2025-01-03T00:00:00.000Z'),
  };

  // In-memory store to simulate DB with owner-scoping
  let collectionsStore: Collection[] = [];

  let testNoToken: (
    method: string,
    path: string,
    body?: unknown,
  ) => Promise<void>;

  const mockPrisma = {
    collection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bookmark: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        CollectionsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  beforeEach(() => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    mockPrivateKey = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
    mockPublicKey = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    jest.clearAllMocks();
    collectionsStore = [col1, col2, colOtherUser];

    // Wire mocks to the in-memory store with owner-scoping
    mockPrisma.collection.create.mockImplementation(
      (args: { data: { name: string; ownerId: string } }) => {
        const newCol: Collection = {
          id: `new-${Date.now()}`,
          name: args.data.name,
          ownerId: args.data.ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        collectionsStore.push(newCol);
        return Promise.resolve(newCol);
      },
    );

    mockPrisma.collection.findMany.mockImplementation(
      (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, string>;
        include?: unknown;
      }) => {
        let results = collectionsStore.filter(
          (c) => c.ownerId === (args.where.ownerId as string),
        );

        // Apply name filter if present
        if (
          args.where.name &&
          typeof args.where.name === 'object' &&
          'contains' in (args.where.name as Record<string, unknown>)
        ) {
          const filter = args.where.name as {
            contains: string;
            mode: string;
          };
          if (filter.contains) {
            results = results.filter((c) =>
              c.name.toLowerCase().includes(filter.contains.toLowerCase()),
            );
          }
        }

        // Sort
        const orderBy = args.orderBy || { createdAt: 'desc' };
        const [colKey, dir] = Object.entries(orderBy)[0];
        results.sort((a, b) => {
          const aVal = a[colKey as keyof Collection];
          const bVal = b[colKey as keyof Collection];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return dir === 'asc'
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          const aDate = (aVal as Date).getTime();
          const bDate = (bVal as Date).getTime();
          return dir === 'asc' ? aDate - bDate : bDate - aDate;
        });

        return Promise.resolve(
          results.map((c) => ({ ...c, _count: { bookmarks: 3 } })),
        );
      },
    );

    mockPrisma.collection.findUnique.mockImplementation(
      (args: { where: { id?: string; ownerId?: string } }) => {
        const col = collectionsStore.find(
          (c) => c.id === args.where.id && c.ownerId === args.where.ownerId,
        );
        if (!col) return Promise.resolve(null);
        return Promise.resolve({ ...col, _count: { bookmarks: 3 } });
      },
    );

    mockPrisma.collection.update.mockImplementation(
      (args: {
        where: { id: string; ownerId: string };
        data: Record<string, string>;
      }) => {
        const idx = collectionsStore.findIndex(
          (c) => c.id === args.where.id && c.ownerId === args.where.ownerId,
        );
        if (idx === -1) return Promise.reject(new Error('Record not found'));
        const updated = {
          ...collectionsStore[idx],
          ...args.data,
          updatedAt: new Date(),
        };
        collectionsStore[idx] = updated;
        return Promise.resolve(updated);
      },
    );

    mockPrisma.collection.delete.mockImplementation(
      (args: { where: { id: string; ownerId: string } }) => {
        const idx = collectionsStore.findIndex(
          (c) => c.id === args.where.id && c.ownerId === args.where.ownerId,
        );
        if (idx === -1) return Promise.reject(new Error('Record not found'));
        const [deleted] = collectionsStore.splice(idx, 1);
        return Promise.resolve(deleted);
      },
    );

    mockPrisma.bookmark.updateMany.mockResolvedValue({ count: 0 });

    mockPrisma.$transaction.mockImplementation(
      (operations: Promise<unknown>[]) => Promise.all(operations),
    );

    // Helper to test 401 without token
    testNoToken = async (method: string, path: string, body?: unknown) => {
      const http = request(app.getHttpServer());
      let req: request.Test;
      switch (method) {
        case 'get':
          req = http.get(path);
          break;
        case 'post':
          req = http.post(path);
          break;
        case 'put':
          req = http.put(path);
          break;
        case 'patch':
          req = http.patch(path);
          break;
        case 'delete':
          req = http.delete(path);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      await req.send(body).expect(401);
    };
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Auth guard ────────────────────────────────────────────

  it('returns 401 without a bearer token', async () => {
    await testNoToken('get', '/collections');
  });

  // POST /collections ────────────────────────────────────────

  it('POST /collections returns 401 without token', async () => {
    await testNoToken('post', '/collections');
  });

  // GET /collections/:id ─────────────────────────────────────

  it('GET /collections/:id returns 401 without token', async () => {
    await testNoToken('get', '/collections/:id');
  });

  // PUT /collections/:id ──────────────────────────────────────

  it('PUT /collections/:id returns 401 without token', async () => {
    await testNoToken('put', '/collections/:id');
  });

  // PATCH /collections/:id ────────────────────────────────────

  it('PATCH /collections/:id returns 401 without token', async () => {
    await testNoToken('patch', '/collections/:id');
  });

  // DELETE /collections/:id ───────────────────────────────────

  it('DELETE /collections/:id returns 401 without token', async () => {
    await testNoToken('delete', '/collections/:id');
  });

  // ─── POST /collections ──────────────────────────────────────

  it('POST /collections creates a collection and returns 201', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Collection' })
      .expect(201);

    const data = body<Collection>(res);
    expect(data.name).toBe('New Collection');
    expect(data.ownerId).toBe(userOneId);
    expect(data.id).toBeDefined();
  });

  it('POST /collections with empty name returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })
      .expect(400);
  });

  it('POST /collections with name longer than 100 chars returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'a'.repeat(101) })
      .expect(400);
  });

  // ─── GET /collections ───────────────────────────────────────

  it('GET /collections returns 200 with bookmark counts, default sort createdAt desc', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/collections')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<CollectionResponse[]>(res);
    expect(data).toHaveLength(2);
    expect(data[0]._count).toEqual({ bookmarks: 3 });
    expect(data[1]._count).toEqual({ bookmarks: 3 });
    // Default sort: createdAt desc — col2 (Jan 2) before col1 (Jan 1)
    expect(new Date(data[0].createdAt).getTime()).toBeGreaterThan(
      new Date(data[1].createdAt).getTime(),
    );
  });

  it('GET /collections?name=tech returns only matching collections', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/collections?name=tech')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<CollectionResponse[]>(res);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Tech Bookmarks');
  });

  it('GET /collections?sortBy=name&sortOrder=asc returns sorted correctly', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/collections?sortBy=name&sortOrder=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<CollectionResponse[]>(res);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Design Links');
    expect(data[1].name).toBe('Tech Bookmarks');
  });

  it('GET /collections?sortBy=invalid returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/collections?sortBy=invalid')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  // ─── GET /collections/:id ────────────────────────────────────

  it('GET /collections/:id returns 200 with bookmark count', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<CollectionResponse>(res);
    expect(data.id).toBe('col-1');
    expect(data.name).toBe('Tech Bookmarks');
    expect(data._count).toEqual({ bookmarks: 3 });
  });

  it('GET /collections/:id for non-existent returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/collections/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  // ─── PUT /collections/:id ────────────────────────────────────

  it('PUT /collections/:id updates collection and returns 200', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .put('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    const data = body<Collection>(res);
    expect(data.name).toBe('Updated Name');
    expect(data.id).toBe('col-1');
  });

  it('PUT /collections/:id with empty name returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })
      .expect(400);
  });

  it('PUT /collections/:id for non-existent returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/collections/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(404);
  });

  // ─── PATCH /collections/:id ──────────────────────────────────

  it('PATCH /collections/:id partially updates and returns 200', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .patch('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Patched Name' })
      .expect(200);

    const data = body<Collection>(res);
    expect(data.name).toBe('Patched Name');
    expect(data.id).toBe('col-1');
  });

  it('PATCH /collections/:id with empty body {} returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it('PATCH /collections/:id with null name returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: null })
      .expect(400);
  });

  it('PATCH /collections/:id for non-existent returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/collections/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Patched Name' })
      .expect(404);
  });

  // ─── DELETE /collections/:id ─────────────────────────────────

  it('DELETE /collections/:id returns 204', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .delete('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('DELETE /collections/:id for non-existent returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .delete('/collections/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  // ─── Cross-owner isolation ──────────────────────────────────

  it('cannot see another user collection via GET /collections', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/collections')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<CollectionResponse[]>(res);
    const ids = data.map((c) => c.id);
    expect(ids).not.toContain('col-other');
  });

  it('cannot view another user collection via GET /collections/:id', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/collections/col-other')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('cannot update another user collection via PUT', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/collections/col-other')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked' })
      .expect(404);
  });

  it('cannot patch another user collection', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/collections/col-other')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked' })
      .expect(404);
  });

  it('cannot delete another user collection', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .delete('/collections/col-other')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
