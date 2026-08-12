import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/jwt.strategy';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { PatchBookmarkDto } from './dto/patch-bookmark.dto';
import { QueryBookmarksDto } from './dto/query-bookmarks.dto';
import type { BookmarkResponse } from './dto/bookmark.response';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateBookmarkDto,
  ): Promise<BookmarkResponse> {
    return this.bookmarksService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: QueryBookmarksDto,
  ): Promise<BookmarkResponse[]> {
    return this.bookmarksService.findAll(req.user.sub, query);
  }

  @Get(':id')
  async findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<BookmarkResponse> {
    return this.bookmarksService.findOne(id, req.user.sub);
  }

  @Put(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookmarkDto,
  ): Promise<BookmarkResponse> {
    return this.bookmarksService.update(id, req.user.sub, dto);
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: PatchBookmarkDto,
  ): Promise<BookmarkResponse> {
    // Reject empty body — at least one field must be present
    if (
      dto.url === undefined &&
      dto.title === undefined &&
      dto.notes === undefined &&
      dto.collectionId === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }
    return this.bookmarksService.patch(id, req.user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.bookmarksService.delete(id, req.user.sub);
  }
}
