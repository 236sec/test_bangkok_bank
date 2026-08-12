import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import type { Bookmark } from '../../generated/prisma/client';
import type { Collection } from '../../generated/prisma/client';
import { CollectionsModule } from '../collections/collections.module';
import { BookmarksModule } from './bookmarks.module';
import type { BookmarkResponse } from './dto/bookmark.response';

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

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

describe('BookmarksController', () => {
  let app: INestApplication<App>;

  const userOneId = 'auth0|user-1';
  const userTwoId = 'auth0|user-2';

  const userOneCollection: Collection = {
    id: 'col-1',
    name: 'Tech Bookmarks',
    ownerId: userOneId,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const userTwoCollection: Collection = {
    id: 'col-other',
    name: 'Other Collection',
    ownerId: userTwoId,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const bm1: Bookmark = {
    id: 'bm-1',
    url: 'https://example.com',
    title: 'Example Site',
    favicon: 'https://example.com/favicon.ico',
    notes: null,
    collectionId: 'col-1',
    ownerId: userOneId,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const bm2: Bookmark = {
    id: 'bm-2',
    url: 'https://github.com',
    title: 'GitHub',
    favicon: null,
    notes: 'Code stuff',
    collectionId: null,
    ownerId: userOneId,
    createdAt: new Date('2025-01-02T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  const bmOtherUser: Bookmark = {
    id: 'bm-other',
    url: 'https://other.com',
    title: 'Other User Bookmark',
    favicon: null,
    notes: null,
    collectionId: null,
    ownerId: userTwoId,
    createdAt: new Date('2025-01-03T00:00:00.000Z'),
    updatedAt: new Date('2025-01-03T00:00:00.000Z'),
  };

  // In-memory stores
  let bookmarksStore: Bookmark[] = [];
  let collectionsStore: Collection[] = [];

  let testNoToken: (
    method: string,
    path: string,
    body?: unknown,
  ) => Promise<void>;

  const mockPrisma = {
    bookmark: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    collection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        BookmarksModule,
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
    mockFetch.mockReset();

    // Default fetch mock — return basic HTML
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          '<html><head><title>Fetched Title</title><link rel="icon" href="/favicon.ico"></head></html>',
        ),
    });

    bookmarksStore = [bm1, bm2, bmOtherUser];
    collectionsStore = [userOneCollection, userTwoCollection];

    // Wire bookmark mocks to the in-memory store with owner-scoping
    mockPrisma.bookmark.create.mockImplementation(
      (args: { data: Record<string, unknown>; include?: unknown }) => {
        const newBm: Bookmark = {
          id: `new-${Date.now()}`,
          url: args.data.url as string,
          title: args.data.title as string,
          favicon: (args.data.favicon as string) ?? null,
          notes: (args.data.notes as string) ?? null,
          collectionId: (args.data.collectionId as string) ?? null,
          ownerId: args.data.ownerId as string,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        bookmarksStore.push(newBm);

        // Build include for collection
        let collection: { id: string; name: string } | null = null;
        if (newBm.collectionId) {
          const col = collectionsStore.find((c) => c.id === newBm.collectionId);
          if (col) {
            collection = { id: col.id, name: col.name };
          }
        }

        return Promise.resolve({ ...newBm, collection });
      },
    );

    mockPrisma.bookmark.findMany.mockImplementation(
      (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, string>;
        include?: unknown;
      }) => {
        let results = bookmarksStore.filter(
          (b) => b.ownerId === (args.where.ownerId as string),
        );

        // Apply collectionId filter
        if (args.where.collectionId) {
          results = results.filter(
            (b) => b.collectionId === args.where.collectionId,
          );
        }

        // Apply title filter
        if (
          args.where.title &&
          typeof args.where.title === 'object' &&
          'contains' in (args.where.title as Record<string, unknown>)
        ) {
          const filter = args.where.title as {
            contains: string;
            mode: string;
          };
          if (filter.contains) {
            results = results.filter((b) =>
              b.title.toLowerCase().includes(filter.contains.toLowerCase()),
            );
          }
        }

        // Apply url filter
        if (
          args.where.url &&
          typeof args.where.url === 'object' &&
          'contains' in (args.where.url as Record<string, unknown>)
        ) {
          const filter = args.where.url as {
            contains: string;
            mode: string;
          };
          if (filter.contains) {
            results = results.filter((b) =>
              b.url.toLowerCase().includes(filter.contains.toLowerCase()),
            );
          }
        }

        // Sort
        const orderBy = args.orderBy || { createdAt: 'desc' };
        const [colKey, dir] = Object.entries(orderBy)[0];
        results.sort((a, b) => {
          const aVal = a[colKey as keyof Bookmark];
          const bVal = b[colKey as keyof Bookmark];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return dir === 'asc'
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          const aDate = (aVal as Date).getTime();
          const bDate = (bVal as Date).getTime();
          return dir === 'asc' ? aDate - bDate : bDate - aDate;
        });

        // Attach collection info
        return Promise.resolve(
          results.map((b) => {
            let collection: { id: string; name: string } | null = null;
            if (b.collectionId) {
              const col = collectionsStore.find((c) => c.id === b.collectionId);
              if (col) {
                collection = { id: col.id, name: col.name };
              }
            }
            return { ...b, collection };
          }),
        );
      },
    );

    mockPrisma.bookmark.findUnique.mockImplementation(
      (args: { where: { id?: string; ownerId?: string } }) => {
        const bm = bookmarksStore.find(
          (b) => b.id === args.where.id && b.ownerId === args.where.ownerId,
        );
        if (!bm) return Promise.resolve(null);
        let collection: { id: string; name: string } | null = null;
        if (bm.collectionId) {
          const col = collectionsStore.find((c) => c.id === bm.collectionId);
          if (col) {
            collection = { id: col.id, name: col.name };
          }
        }
        return Promise.resolve({ ...bm, collection });
      },
    );

    mockPrisma.bookmark.update.mockImplementation(
      (args: {
        where: { id: string; ownerId: string };
        data: Record<string, unknown>;
        include?: unknown;
      }) => {
        const idx = bookmarksStore.findIndex(
          (b) => b.id === args.where.id && b.ownerId === args.where.ownerId,
        );
        if (idx === -1) return Promise.reject(new Error('Record not found'));
        const updated = {
          ...bookmarksStore[idx],
          ...(args.data as Partial<Bookmark>),
          updatedAt: new Date(),
        };
        bookmarksStore[idx] = updated;

        let collection: { id: string; name: string } | null = null;
        if (updated.collectionId) {
          const col = collectionsStore.find(
            (c) => c.id === updated.collectionId,
          );
          if (col) {
            collection = { id: col.id, name: col.name };
          }
        }

        return Promise.resolve({ ...updated, collection });
      },
    );

    mockPrisma.bookmark.delete.mockImplementation(
      (args: { where: { id: string; ownerId: string } }) => {
        const idx = bookmarksStore.findIndex(
          (b) => b.id === args.where.id && b.ownerId === args.where.ownerId,
        );
        if (idx === -1) return Promise.reject(new Error('Record not found'));
        const [deleted] = bookmarksStore.splice(idx, 1);
        return Promise.resolve(deleted);
      },
    );

    // Wire collection mocks for the findByCollection / ensureCollectionOwnership
    mockPrisma.collection.findUnique.mockImplementation(
      (args: { where: { id?: string; ownerId?: string } }) => {
        const col = collectionsStore.find(
          (c) => c.id === args.where.id && c.ownerId === args.where.ownerId,
        );
        if (!col) return Promise.resolve(null);
        return Promise.resolve({ ...col, _count: { bookmarks: 3 } });
      },
    );

    mockPrisma.collection.findMany.mockImplementation(
      (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, string>;
        include?: unknown;
      }) => {
        const results = collectionsStore.filter(
          (c) => c.ownerId === (args.where.ownerId as string),
        );
        return Promise.resolve(
          results.map((c) => ({ ...c, _count: { bookmarks: 3 } })),
        );
      },
    );

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

  // ─── Auth guard — every route returns 401 without token ─────

  it('POST /bookmarks returns 401 without token', async () => {
    await testNoToken('post', '/bookmarks');
  });

  it('GET /bookmarks returns 401 without token', async () => {
    await testNoToken('get', '/bookmarks');
  });

  it('GET /bookmarks/:id returns 401 without token', async () => {
    await testNoToken('get', '/bookmarks/:id');
  });

  it('PUT /bookmarks/:id returns 401 without token', async () => {
    await testNoToken('put', '/bookmarks/:id');
  });

  it('PATCH /bookmarks/:id returns 401 without token', async () => {
    await testNoToken('patch', '/bookmarks/:id');
  });

  it('DELETE /bookmarks/:id returns 401 without token', async () => {
    await testNoToken('delete', '/bookmarks/:id');
  });

  // ─── POST /bookmarks ────────────────────────────────────────

  it('POST /bookmarks with valid url returns 201 with fetched metadata', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://new-site.com' })
      .expect(201);

    const data = body<BookmarkResponse>(res);
    expect(data.url).toBe('https://new-site.com');
    expect(data.title).toBe('Fetched Title');
    expect(data.favicon).toBe('https://new-site.com/favicon.ico');
    expect(data.ownerId).toBe(userOneId);
    expect(data.id).toBeDefined();
  });

  it('POST /bookmarks with explicit title uses explicit title', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://new-site.com', title: 'My Title' })
      .expect(201);

    const data = body<BookmarkResponse>(res);
    expect(data.title).toBe('My Title');
  });

  it('POST /bookmarks with invalid url returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'not-a-url' })
      .expect(400);
  });

  it('POST /bookmarks with notes exceeding 500 chars returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com', notes: 'a'.repeat(501) })
      .expect(400);
  });

  it('POST /bookmarks with non-existent collectionId returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        url: 'https://example.com',
        collectionId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(404);
  });

  // ─── GET /bookmarks ─────────────────────────────────────────

  it('GET /bookmarks returns 200 with user bookmarks and collection info', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    expect(data).toHaveLength(2);
    expect(data[0].collection).toBeDefined();
  });

  it('GET /bookmarks?title=example returns filtered results', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks?title=example')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Example Site');
  });

  it('GET /bookmarks?url=github returns filtered results', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks?url=github')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    expect(data).toHaveLength(1);
    expect(data[0].url).toBe('https://github.com');
  });

  it('GET /bookmarks?title=example&url=github returns bookmarks matching both', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks?title=example&url=github')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    expect(data).toHaveLength(0);
  });

  it('GET /bookmarks?sortBy=title&sortOrder=asc returns sorted results', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks?sortBy=title&sortOrder=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    expect(data[0].title).toBe('Example Site');
    expect(data[1].title).toBe('GitHub');
  });

  it('GET /bookmarks?sortBy=invalid returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/bookmarks?sortBy=invalid')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  // ─── GET /bookmarks/:id ────────────────────────────────────

  it('GET /bookmarks/:id returns 200 with collection info', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse>(res);
    expect(data.id).toBe('bm-1');
    expect(data.collection).toEqual({ id: 'col-1', name: 'Tech Bookmarks' });
  });

  it('GET /bookmarks/:id with non-existent id returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/bookmarks/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  // ─── PUT /bookmarks/:id ────────────────────────────────────

  it('PUT /bookmarks/:id with valid url + title returns 200', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .put('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://updated.com', title: 'Updated Title' })
      .expect(200);

    const data = body<BookmarkResponse>(res);
    expect(data.url).toBe('https://updated.com');
    expect(data.title).toBe('Updated Title');
  });

  it('PUT /bookmarks/:id with invalid url returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'not-a-url', title: 'Test' })
      .expect(400);
  });

  it('PUT /bookmarks/:id with empty title returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com', title: '' })
      .expect(400);
  });

  it('PUT /bookmarks/:id with non-existent id returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/bookmarks/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com', title: 'Test' })
      .expect(404);
  });

  // ─── PATCH /bookmarks/:id ──────────────────────────────────

  it('PATCH /bookmarks/:id with title returns 200', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .patch('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Patched Title' })
      .expect(200);

    const data = body<BookmarkResponse>(res);
    expect(data.title).toBe('Patched Title');
  });

  it('PATCH /bookmarks/:id with changed url re-fetches metadata', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .patch('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://new-url.com' })
      .expect(200);

    const data = body<BookmarkResponse>(res);
    expect(data.url).toBe('https://new-url.com');
    expect(data.title).toBe('Fetched Title');
    expect(data.favicon).toBe('https://new-url.com/favicon.ico');
  });

  it('PATCH /bookmarks/:id with empty body {} returns 400', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it('PATCH /bookmarks/:id with non-existent id returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/bookmarks/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test' })
      .expect(404);
  });

  // ─── DELETE /bookmarks/:id ─────────────────────────────────

  it('DELETE /bookmarks/:id returns 204', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .delete('/bookmarks/bm-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('DELETE /bookmarks/:id with non-existent id returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .delete('/bookmarks/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  // ─── Cross-owner isolation ──────────────────────────────────

  it('cannot see another user bookmark via GET /bookmarks', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    const ids = data.map((b) => b.id);
    expect(ids).not.toContain('bm-other');
  });

  it('cannot view another user bookmark via GET /bookmarks/:id', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/bookmarks/bm-other')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('cannot update another user bookmark via PUT', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .put('/bookmarks/bm-other')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com', title: 'Hacked' })
      .expect(404);
  });

  it('cannot patch another user bookmark', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .patch('/bookmarks/bm-other')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hacked' })
      .expect(404);
  });

  it('cannot delete another user bookmark', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .delete('/bookmarks/bm-other')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  // ─── GET /collections/:id/bookmarks ────────────────────────

  it('GET /collections/:id/bookmarks returns 200 with bookmarks in that collection', async () => {
    const token = signToken(userOneId);

    const res = await request(app.getHttpServer())
      .get('/collections/col-1/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = body<BookmarkResponse[]>(res);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('bm-1');
    expect(data[0].collection).toEqual({
      id: 'col-1',
      name: 'Tech Bookmarks',
    });
  });

  it('GET /collections/:id/bookmarks with non-existent collection returns 404', async () => {
    const token = signToken(userOneId);

    await request(app.getHttpServer())
      .get('/collections/non-existent/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('GET /collections/:id/bookmarks returns 401 without token', async () => {
    await testNoToken('get', '/collections/col-1/bookmarks');
  });
});
