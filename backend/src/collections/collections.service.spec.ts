import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Collection } from '../../generated/prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const mockCollection: Collection = {
    id: 'col-1',
    name: 'Tech Bookmarks',
    ownerId: 'auth0|user-1',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockCollectionWithCount = {
    ...mockCollection,
    _count: { bookmarks: 3 },
  };

  // Helper to create a mock PrismaService with chained methods
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
    $transaction: jest.fn(async (ops: unknown[]) => {
      // Execute each operation in the array (they're Promises)
      return Promise.all(ops);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a collection with the given name and ownerId', async () => {
      mockPrisma.collection.create.mockResolvedValue(mockCollection);

      const result = await service.create('auth0|user-1', {
        name: 'Tech Bookmarks',
      });

      expect(mockPrisma.collection.create).toHaveBeenCalledWith({
        data: {
          name: 'Tech Bookmarks',
          ownerId: 'auth0|user-1',
        },
      });
      expect(result).toEqual(mockCollection);
    });
  });

  describe('findAll', () => {
    it('returns only collections matching ownerId', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([
        mockCollectionWithCount,
      ]);

      const result = await service.findAll('auth0|user-1', {});

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'auth0|user-1' },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { bookmarks: true } } },
      });
      expect(result).toEqual([mockCollectionWithCount]);
    });

    it('applies name filter with case-insensitive partial match', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([
        mockCollectionWithCount,
      ]);

      const result = await service.findAll('auth0|user-1', { name: 'tech' });

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 'auth0|user-1',
          name: { contains: 'tech', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { bookmarks: true } } },
      });
      expect(result).toEqual([mockCollectionWithCount]);
    });

    it('applies sortBy and sortOrder', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([
        mockCollectionWithCount,
      ]);

      const result = await service.findAll('auth0|user-1', {
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'auth0|user-1' },
        orderBy: { name: 'asc' },
        include: { _count: { select: { bookmarks: true } } },
      });
      expect(result).toEqual([mockCollectionWithCount]);
    });

    it('defaults to createdAt desc when no sort options provided', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([
        mockCollectionWithCount,
      ]);

      await service.findAll('auth0|user-1', {});

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('includes bookmark counts', async () => {
      mockPrisma.collection.findMany.mockResolvedValue([
        mockCollectionWithCount,
      ]);

      const result = await service.findAll('auth0|user-1', {});

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { bookmarks: true } } },
        }),
      );
      expect(result[0]._count).toEqual({ bookmarks: 3 });
    });
  });

  describe('findOne', () => {
    it('returns collection when it exists and belongs to ownerId', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(
        mockCollectionWithCount,
      );

      const result = await service.findOne('col-1', 'auth0|user-1');

      expect(mockPrisma.collection.findUnique).toHaveBeenCalledWith({
        where: { id: 'col-1', ownerId: 'auth0|user-1' },
        include: { _count: { select: { bookmarks: true } } },
      });
      expect(result).toEqual(mockCollectionWithCount);
    });

    it('throws NotFoundException when collection does not exist', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'auth0|user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when collection belongs to another owner', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(service.findOne('col-1', 'auth0|user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('fully replaces the collection name', async () => {
      const updatedCollection = {
        ...mockCollection,
        name: 'Updated Tech',
      };
      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection);
      mockPrisma.collection.update.mockResolvedValue(updatedCollection);

      const result = await service.update('col-1', 'auth0|user-1', {
        name: 'Updated Tech',
      });

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1', ownerId: 'auth0|user-1' },
        data: { name: 'Updated Tech' },
      });
      expect(result).toEqual(updatedCollection);
    });

    it('throws NotFoundException when collection does not exist', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'auth0|user-1', {
          name: 'Updated Tech',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when collection belongs to another owner', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('col-1', 'auth0|user-2', { name: 'Updated Tech' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('patch', () => {
    it('partially updates only the provided fields', async () => {
      const patchedCollection = {
        ...mockCollection,
        name: 'Patched Name',
      };
      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection);
      mockPrisma.collection.update.mockResolvedValue(patchedCollection);

      const result = await service.patch('col-1', 'auth0|user-1', {
        name: 'Patched Name',
      });

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1', ownerId: 'auth0|user-1' },
        data: { name: 'Patched Name' },
      });
      expect(result).toEqual(patchedCollection);
    });

    it('throws NotFoundException when collection does not exist', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.patch('non-existent', 'auth0|user-1', {
          name: 'Patched Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when collection belongs to another owner', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.patch('col-1', 'auth0|user-2', { name: 'Patched Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('disassociates bookmarks then deletes in transaction, verifying ordering', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection);
      mockPrisma.bookmark.updateMany.mockResolvedValue({ count: 3 });

      await service.delete('col-1', 'auth0|user-1');

      // Both operations are passed to $transaction as an array
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const txArgs = mockPrisma.$transaction.mock.calls[0][0];
      expect(Array.isArray(txArgs)).toBe(true);
      expect(txArgs).toHaveLength(2);

      // Verify updateMany is called before delete by checking invocation order
      // (JavaScript evaluates array elements left-to-right, so updateMany at index 0
      // is invoked before delete at index 1 when the array literal is constructed)
      expect(mockPrisma.bookmark.updateMany).toHaveBeenCalledWith({
        where: { collectionId: 'col-1', ownerId: 'auth0|user-1' },
        data: { collectionId: null },
      });
      expect(mockPrisma.collection.delete).toHaveBeenCalledWith({
        where: { id: 'col-1', ownerId: 'auth0|user-1' },
      });

      const updateManyOrder =
        mockPrisma.bookmark.updateMany.mock.invocationCallOrder[0];
      const deleteOrder =
        mockPrisma.collection.delete.mock.invocationCallOrder[0];
      expect(updateManyOrder).toBeLessThan(deleteOrder);
    });

    it('throws NotFoundException when collection does not exist', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('non-existent', 'auth0|user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when collection belongs to another owner', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(service.delete('col-1', 'auth0|user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
