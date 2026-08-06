import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// The JWT strategy requires Auth0 configuration at construction time.
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'test-audience';

// A live Auth0 tenant is not reachable in tests, so the JWKS key provider is
// replaced with a fixed test secret (also avoids loading jose ESM in jest).
jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(
    () =>
      (
        _req: unknown,
        _token: unknown,
        done: (err: Error | null, secret?: string) => void,
      ): void => {
        done(null, 'test-secret');
      },
  ),
}));

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
