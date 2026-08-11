import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../auth/auth.module';
import { JwtPayload } from '../auth/jwt.strategy';
import { UsersModule } from './users.module';

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

function signToken(payload: JwtPayload): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  signer.end();
  const signature = signer.sign(mockPrivateKey).toString('base64url');
  return `${header}.${body}.${signature}`;
}

describe('UsersController', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the authenticated user profile for GET /me', async () => {
    const token = signToken({
      sub: 'auth0|user-123',
      iss: 'https://test.auth0.com/',
      aud: 'test-audience',
    });

    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ sub: 'auth0|user-123' });
  });

  it('returns 401 for GET /me when not authenticated', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
  });
});
