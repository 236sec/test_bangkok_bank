import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: pg.Pool;

  constructor(private configService: ConfigService) {
    const pgPool = new pg.Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    super({ adapter: new PrismaPg(pgPool) });
    this.pool = pgPool;
  }

  async onModuleInit() {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to database');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${MAX_RETRIES} failed`,
        );
        if (attempt === MAX_RETRIES) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
