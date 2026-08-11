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
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { PatchCollectionDto } from './dto/patch-collection.dto';
import { QueryCollectionsDto } from './dto/query-collections.dto';
import type { CollectionResponse } from './dto/collection.response';
import type { Collection } from '../../generated/prisma/client';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCollectionDto,
  ): Promise<Collection> {
    return this.collectionsService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: QueryCollectionsDto,
  ): Promise<CollectionResponse[]> {
    return this.collectionsService.findAll(req.user.sub, query);
  }

  @Get(':id')
  async findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<CollectionResponse> {
    return this.collectionsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<Collection> {
    return this.collectionsService.update(id, req.user.sub, dto);
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: PatchCollectionDto,
  ): Promise<Collection> {
    // Reject empty body — at least one field must be present
    if (dto.name === undefined) {
      throw new BadRequestException('At least one field must be provided');
    }
    return this.collectionsService.patch(id, req.user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.collectionsService.delete(id, req.user.sub);
  }
}
