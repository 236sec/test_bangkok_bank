import { Module } from '@nestjs/common';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  controllers: [CollectionsController],
  providers: [CollectionsService, BookmarksService],
})
export class CollectionsModule {}
