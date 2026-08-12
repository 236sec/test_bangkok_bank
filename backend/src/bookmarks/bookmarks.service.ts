import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Bookmark } from '../../generated/prisma/client';
import type { CreateBookmarkDto } from './dto/create-bookmark.dto';
import type { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import type { PatchBookmarkDto } from './dto/patch-bookmark.dto';
import type { QueryBookmarksDto } from './dto/query-bookmarks.dto';
import type { BookmarkResponse } from './dto/bookmark.response';

/** Allowed sort columns */
type SortableColumn = 'title' | 'createdAt' | 'updatedAt';

/** Sort direction */
type SortOrder = 'asc' | 'desc';

interface FetchedMetadata {
  title: string | null;
  favicon: string | null;
}

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create a new bookmark with URL metadata fetching. */
  async create(
    ownerId: string,
    dto: CreateBookmarkDto,
  ): Promise<BookmarkResponse> {
    // Validate collection ownership if collectionId is provided
    if (dto.collectionId) {
      await this.ensureCollectionOwnership(dto.collectionId, ownerId);
    }

    const metadata = await this.fetchMetadata(dto.url);

    const title = this.resolveTitle(dto.title, metadata.title, dto.url);

    const bookmark = await this.prisma.bookmark.create({
      data: {
        url: dto.url,
        title,
        favicon: metadata.favicon,
        notes: dto.notes ?? null,
        collectionId: dto.collectionId ?? null,
        ownerId,
      },
      include: {
        collection: dto.collectionId
          ? { select: { id: true, name: true } }
          : false,
      },
    });

    return this.toResponse(bookmark);
  }

  /** List bookmarks for the given owner with optional filters and sorting. */
  async findAll(
    ownerId: string,
    query: QueryBookmarksDto,
  ): Promise<BookmarkResponse[]> {
    const where: Record<string, unknown> = { ownerId };

    if (query.title) {
      where.title = { contains: query.title, mode: 'insensitive' };
    }

    if (query.url) {
      where.url = { contains: query.url, mode: 'insensitive' };
    }

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);

    const bookmarks = await this.prisma.bookmark.findMany({
      where,
      orderBy,
      include: { collection: { select: { id: true, name: true } } },
    });

    return bookmarks.map((b) => this.toResponse(b));
  }

  /** Find a single bookmark by id, scoped to ownerId. */
  async findOne(id: string, ownerId: string): Promise<BookmarkResponse> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id, ownerId },
      include: { collection: { select: { id: true, name: true } } },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return this.toResponse(bookmark);
  }

  /** Fully replace a bookmark (PUT). Re-fetches metadata if URL changed. */
  async update(
    id: string,
    ownerId: string,
    dto: UpdateBookmarkDto,
  ): Promise<BookmarkResponse> {
    const existing = await this.ensureOwnership(id, ownerId);

    // Validate collection ownership if collectionId is provided
    if (dto.collectionId) {
      await this.ensureCollectionOwnership(dto.collectionId, ownerId);
    }

    const urlChanged = dto.url !== existing.url;

    let favicon: string | null = existing.favicon;
    if (urlChanged) {
      const metadata = await this.fetchMetadata(dto.url);
      favicon = metadata.favicon;
    }

    const updated = await this.prisma.bookmark.update({
      where: { id, ownerId },
      data: {
        url: dto.url,
        title: dto.title,
        favicon,
        notes: dto.notes ?? null,
        collectionId: dto.collectionId ?? null,
      },
      include: { collection: { select: { id: true, name: true } } },
    });

    return this.toResponse(updated);
  }

  /** Partially update a bookmark (PATCH). Re-fetches metadata if URL changed. */
  async patch(
    id: string,
    ownerId: string,
    dto: PatchBookmarkDto,
  ): Promise<BookmarkResponse> {
    const existing = await this.ensureOwnership(id, ownerId);

    // Validate collection ownership if collectionId is provided
    if (dto.collectionId !== undefined) {
      if (dto.collectionId !== null) {
        await this.ensureCollectionOwnership(dto.collectionId, ownerId);
      }
    }

    const data: Record<string, unknown> = {};

    if (dto.url !== undefined) {
      data.url = dto.url;
    }

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    if (dto.collectionId !== undefined) {
      data.collectionId = dto.collectionId;
    }

    const urlChanged = dto.url !== undefined && dto.url !== existing.url;

    // Re-fetch metadata if URL changed
    if (urlChanged) {
      const metadata = await this.fetchMetadata(dto.url!);
      data.favicon = metadata.favicon;

      // If no explicit title provided, use fetched title or URL fallback
      if (dto.title === undefined) {
        data.title = this.resolveTitle(undefined, metadata.title, dto.url!);
      }
    }

    const updated = await this.prisma.bookmark.update({
      where: { id, ownerId },
      data,
      include: { collection: { select: { id: true, name: true } } },
    });

    return this.toResponse(updated);
  }

  /** Delete a bookmark by id, scoped to ownerId. */
  async delete(id: string, ownerId: string): Promise<void> {
    await this.ensureOwnership(id, ownerId);

    await this.prisma.bookmark.delete({
      where: { id, ownerId },
    });
  }

  /** List bookmarks in a specific collection, scoped to ownerId. */
  async findByCollection(
    collectionId: string,
    ownerId: string,
    sortBy?: string,
    sortOrder?: string,
  ): Promise<BookmarkResponse[]> {
    // Verify collection exists and belongs to ownerId
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId, ownerId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const bookmarks = await this.prisma.bookmark.findMany({
      where: { collectionId, ownerId },
      orderBy,
      include: { collection: { select: { id: true, name: true } } },
    });

    return bookmarks.map((b) => this.toResponse(b));
  }

  // --- Private helpers ---

  /** Verify a bookmark exists and belongs to ownerId. Returns the bookmark. */
  private async ensureOwnership(
    id: string,
    ownerId: string,
  ): Promise<Bookmark> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id, ownerId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return bookmark;
  }

  /** Verify a collection exists and belongs to ownerId. Throws 404 otherwise. */
  private async ensureCollectionOwnership(
    collectionId: string,
    ownerId: string,
  ): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId, ownerId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }

  /** Resolve title priority: explicit > fetched > URL fallback. */
  private resolveTitle(
    explicit: string | undefined,
    fetched: string | null,
    url: string,
  ): string {
    if (explicit) return explicit;
    if (fetched) return fetched;
    return url;
  }

  /** Build orderBy clause from sort parameters with safe defaults. */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string,
  ): Record<string, SortOrder> {
    const column: SortableColumn =
      sortBy === 'title' || sortBy === 'updatedAt' ? sortBy : 'createdAt';
    const order: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    return { [column]: order };
  }

  /** Fetch URL metadata: title and favicon from HTML. */
  private async fetchMetadata(url: string): Promise<FetchedMetadata> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BookmarkManager/1.0',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return { title: null, favicon: null };
      }

      const html = await response.text();
      return this.parseHtml(html, url);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch metadata for ${url}: ${(err as Error).message}`,
      );
      return { title: null, favicon: null };
    }
  }

  /** Parse HTML for title and favicon. */
  private parseHtml(html: string, baseUrl: string): FetchedMetadata {
    const title = this.extractTitle(html);
    const favicon = this.extractFavicon(html, baseUrl);
    return { title, favicon };
  }

  /** Extract <title> tag content from HTML. */
  private extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (match && match[1]) {
      return match[1].trim() || null;
    }
    return null;
  }

  /** Extract favicon URL from HTML link tags. */
  private extractFavicon(html: string, baseUrl: string): string | null {
    // Match <link rel="icon"> or <link rel="shortcut icon">
    const match =
      html.match(
        /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i,
      ) ||
      html.match(
        /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i,
      );

    if (match && match[1]) {
      const href = match[1];
      return this.resolveUrl(href, baseUrl);
    }

    return null;
  }

  /** Resolve a potentially relative URL against a base URL. */
  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }

  /** Transform a Prisma bookmark (with optional collection include) to a response DTO. */
  private toResponse(
    bookmark: Bookmark & { collection?: { id: string; name: string } | null },
  ): BookmarkResponse {
    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      favicon: bookmark.favicon,
      notes: bookmark.notes,
      ownerId: bookmark.ownerId,
      collectionId: bookmark.collectionId,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
      collection: bookmark.collection ?? null,
    };
  }
}
