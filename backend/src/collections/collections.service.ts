import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Collection } from '../../generated/prisma/client';
import type { CreateCollectionDto } from './dto/create-collection.dto';
import type { UpdateCollectionDto } from './dto/update-collection.dto';
import type { PatchCollectionDto } from './dto/patch-collection.dto';
import type { QueryCollectionsDto } from './dto/query-collections.dto';
import type { CollectionResponse } from './dto/collection.response';

/** Allowed sort columns */
type SortableColumn = 'name' | 'createdAt' | 'updatedAt';

/** Sort direction */
type SortOrder = 'asc' | 'desc';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new collection for the given owner. */
  async create(ownerId: string, dto: CreateCollectionDto): Promise<Collection> {
    return this.prisma.collection.create({
      data: {
        name: dto.name,
        ownerId,
      },
    });
  }

  /** List collections for the given owner with optional filters and sorting. */
  async findAll(
    ownerId: string,
    query: QueryCollectionsDto,
  ): Promise<CollectionResponse[]> {
    const where: Record<string, unknown> = { ownerId };

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);

    return this.prisma.collection.findMany({
      where,
      orderBy,
      include: { _count: { select: { bookmarks: true } } },
    });
  }

  /** Find a single collection by id, scoped to ownerId. */
  async findOne(id: string, ownerId: string): Promise<CollectionResponse> {
    const collection = await this.prisma.collection.findUnique({
      where: { id, ownerId },
      include: { _count: { select: { bookmarks: true } } },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  /** Fully replace a collection (PUT). */
  async update(
    id: string,
    ownerId: string,
    dto: UpdateCollectionDto,
  ): Promise<Collection> {
    await this.ensureOwnership(id, ownerId);

    return this.prisma.collection.update({
      where: { id, ownerId },
      data: { name: dto.name },
    });
  }

  /** Partially update a collection (PATCH). */
  async patch(
    id: string,
    ownerId: string,
    dto: PatchCollectionDto,
  ): Promise<Collection> {
    await this.ensureOwnership(id, ownerId);

    const data: Record<string, string> = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    return this.prisma.collection.update({
      where: { id, ownerId },
      data,
    });
  }

  /** Delete a collection — disassociate bookmarks first, then delete in a transaction. */
  async delete(id: string, ownerId: string): Promise<void> {
    await this.ensureOwnership(id, ownerId);

    await this.prisma.$transaction([
      this.prisma.bookmark.updateMany({
        where: { collectionId: id, ownerId },
        data: { collectionId: null },
      }),
      this.prisma.collection.delete({
        where: { id, ownerId },
      }),
    ]);
  }

  // --- Private helpers ---

  /** Verify a collection exists and belongs to ownerId. Throws 404 otherwise. */
  private async ensureOwnership(id: string, ownerId: string): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id, ownerId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }

  /** Build orderBy clause from sort parameters with safe defaults. */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string,
  ): Record<string, SortOrder> {
    const column: SortableColumn =
      sortBy === 'name' || sortBy === 'updatedAt' ? sortBy : 'createdAt';
    const order: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    return { [column]: order };
  }
}
