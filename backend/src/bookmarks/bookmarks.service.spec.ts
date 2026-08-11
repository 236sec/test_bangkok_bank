import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Bookmark } from '../../generated/prisma/client';
import { NotFoundException } from '@nestjs/common';

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('BookmarksService', () => {
  let service: BookmarksService;

  const mockBookmark: Bookmark = {
    id: 'bm-1',
    url: 'https://example.com',
    title: 'Example Site',
    favicon: 'https://example.com/favicon.ico',
    notes: 'A useful reference',
    collectionId: 'col-1',
    ownerId: 'auth0|user-1',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockBookmarkWithCollection = {
    ...mockBookmark,
    collection: { id: 'col-1', name: 'Tech Bookmarks' },
  };

  const mockCollection = {
    id: 'col-1',
    name: 'Tech Bookmarks',
    ownerId: 'auth0|user-1',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockPrisma = {
    bookmark: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    collection: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);

    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('create', () => {
    it('fetches URL metadata and creates a bookmark with resolved title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><title>Example Site</title><link rel="icon" href="/favicon.ico"></head></html>',
          ),
      });
      mockPrisma.bookmark.create.mockResolvedValue(mockBookmarkWithCollection);

      const result = await service.create('auth0|user-1', {
        url: 'https://example.com',
      });

      expect(mockPrisma.bookmark.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com',
          title: 'Example Site',
          favicon: 'https://example.com/favicon.ico',
          notes: null,
          collectionId: null,
          ownerId: 'auth0|user-1',
        },
        include: { collection: false },
      });
      expect(result).toHaveProperty('id', 'bm-1');
      expect(result.favicon).toBe('https://example.com/favicon.ico');
    });

    it('uses explicit title over fetched title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><title>Fetched Title</title></head></html>',
          ),
      });
      mockPrisma.bookmark.create.mockResolvedValue({
        ...mockBookmark,
        title: 'My Custom Title',
        collection: null,
      });

      const result = await service.create('auth0|user-1', {
        url: 'https://example.com',
        title: 'My Custom Title',
      });

      expect(result.title).toBe('My Custom Title');
    });

    it('falls back to URL string when fetch fails and no explicit title', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      mockPrisma.bookmark.create.mockResolvedValue({
        ...mockBookmark,
        title: 'https://example.com',
        favicon: null,
        collection: null,
      });

      const result = await service.create('auth0|user-1', {
        url: 'https://example.com',
      });

      expect(result.title).toBe('https://example.com');
      expect(result.favicon).toBeNull();
    });

    it('assigns to a collection when valid collectionId is provided', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection);
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve('<html><head><title>Example</title></head></html>'),
      });
      mockPrisma.bookmark.create.mockResolvedValue(mockBookmarkWithCollection);

      const result = await service.create('auth0|user-1', {
        url: 'https://example.com',
        collectionId: 'col-1',
      });

      expect(result.collectionId).toBe('col-1');
      expect(result.collection).toEqual({
        id: 'col-1',
        name: 'Tech Bookmarks',
      });
    });

    it('throws NotFoundException when collectionId belongs to another owner', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.create('auth0|user-1', {
          url: 'https://example.com',
          collectionId: 'col-other',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns only bookmarks matching ownerId', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      const result = await service.findAll('auth0|user-1', {});

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'auth0|user-1' },
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { id: true, name: true } } },
      });
      expect(result).toHaveLength(1);
    });

    it('applies title filter with case-insensitive partial match', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      await service.findAll('auth0|user-1', { title: 'example' });

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 'auth0|user-1',
          title: { contains: 'example', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { id: true, name: true } } },
      });
    });

    it('applies url filter with case-insensitive partial match', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      await service.findAll('auth0|user-1', { url: 'example' });

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 'auth0|user-1',
          url: { contains: 'example', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { id: true, name: true } } },
      });
    });

    it('applies both title and url filters (AND)', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      await service.findAll('auth0|user-1', {
        title: 'react',
        url: 'github',
      });

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 'auth0|user-1',
          title: { contains: 'react', mode: 'insensitive' },
          url: { contains: 'github', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { id: true, name: true } } },
      });
    });

    it('applies sortBy and sortOrder', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      await service.findAll('auth0|user-1', {
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });

    it('defaults to createdAt desc', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      await service.findAll('auth0|user-1', {});

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns bookmark when it exists and belongs to ownerId', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(
        mockBookmarkWithCollection,
      );

      const result = await service.findOne('bm-1', 'auth0|user-1');

      expect(mockPrisma.bookmark.findUnique).toHaveBeenCalledWith({
        where: { id: 'bm-1', ownerId: 'auth0|user-1' },
        include: { collection: { select: { id: true, name: true } } },
      });
      expect(result.id).toBe('bm-1');
      expect(result.collection).toEqual({
        id: 'col-1',
        name: 'Tech Bookmarks',
      });
    });

    it('throws NotFoundException when bookmark does not exist', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'auth0|user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when bookmark belongs to another owner', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(service.findOne('bm-1', 'auth0|user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('fully replaces fields and returns updated bookmark', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><title>New Example</title></head></html>',
          ),
      });
      const updated = {
        ...mockBookmark,
        url: 'https://newexample.com',
        title: 'New Example',
        collection: null,
      };
      mockPrisma.bookmark.update.mockResolvedValue(updated);

      const result = await service.update('bm-1', 'auth0|user-1', {
        url: 'https://newexample.com',
        title: 'New Example',
      });

      expect(result.url).toBe('https://newexample.com');
      expect(result.title).toBe('New Example');
    });

    it('re-fetches metadata if URL changed', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><title>New Example</title><link rel="icon" href="/new-favicon.ico"></head></html>',
          ),
      });
      mockPrisma.bookmark.update.mockResolvedValue({
        ...mockBookmark,
        url: 'https://newexample.com',
        title: 'New Example',
        favicon: 'https://newexample.com/new-favicon.ico',
        collection: null,
      });

      const result = await service.update('bm-1', 'auth0|user-1', {
        url: 'https://newexample.com',
        title: 'New Example',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://newexample.com',
        expect.any(Object),
      );
      expect(result.favicon).toBe('https://newexample.com/new-favicon.ico');
    });

    it('throws NotFoundException when bookmark does not exist', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'auth0|user-1', {
          url: 'https://example.com',
          title: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when collectionId belongs to another owner', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('bm-1', 'auth0|user-1', {
          url: 'https://example.com',
          title: 'Test',
          collectionId: 'col-other',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('patch', () => {
    it('partially updates only provided fields', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);
      mockPrisma.bookmark.update.mockResolvedValue({
        ...mockBookmark,
        title: 'Patched Title',
        collection: null,
      });

      const result = await service.patch('bm-1', 'auth0|user-1', {
        title: 'Patched Title',
      });

      expect(mockPrisma.bookmark.update).toHaveBeenCalledWith({
        where: { id: 'bm-1', ownerId: 'auth0|user-1' },
        data: { title: 'Patched Title' },
        include: { collection: { select: { id: true, name: true } } },
      });
      expect(result.title).toBe('Patched Title');
    });

    it('re-fetches metadata if URL changed', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><title>Fetched Title</title><link rel="icon" href="/favicon.ico"></head></html>',
          ),
      });
      mockPrisma.bookmark.update.mockResolvedValue({
        ...mockBookmark,
        url: 'https://newurl.com',
        title: 'Fetched Title',
        favicon: 'https://newurl.com/favicon.ico',
        collection: null,
      });

      const result = await service.patch('bm-1', 'auth0|user-1', {
        url: 'https://newurl.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://newurl.com',
        expect.any(Object),
      );
      expect(result.title).toBe('Fetched Title');
    });

    it('throws NotFoundException when bookmark does not exist', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(
        service.patch('non-existent', 'auth0|user-1', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the bookmark', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);
      mockPrisma.bookmark.delete.mockResolvedValue(mockBookmark);

      await service.delete('bm-1', 'auth0|user-1');

      expect(mockPrisma.bookmark.delete).toHaveBeenCalledWith({
        where: { id: 'bm-1', ownerId: 'auth0|user-1' },
      });
    });

    it('throws NotFoundException when bookmark does not exist', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('non-existent', 'auth0|user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when bookmark belongs to another owner', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(service.delete('bm-1', 'auth0|user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCollection', () => {
    it('returns bookmarks in the collection', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection);
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      const result = await service.findByCollection('col-1', 'auth0|user-1');

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { collectionId: 'col-1', ownerId: 'auth0|user-1' },
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { id: true, name: true } } },
      });
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when collection not found or not owned', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.findByCollection('col-other', 'auth0|user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('applies sortBy and sortOrder', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection);
      mockPrisma.bookmark.findMany.mockResolvedValue([
        mockBookmarkWithCollection,
      ]);

      await service.findByCollection('col-1', 'auth0|user-1', 'title', 'asc');

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });
  });
});
