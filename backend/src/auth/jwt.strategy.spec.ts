import {
  Controller,
  Get,
  INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import * as jwksRsa from 'jwks-rsa';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from './auth.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import type {
  AuthenticatedUser,
  JwtPayload,
  RequestWithUser,
} from './jwt.strategy';

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

const passportJwtSecretMock = jwksRsa.passportJwtSecret as jest.Mock;

// ConfigModule reads from the process environment (dotenv does not override
// existing process.env values), so seed the Auth0 config before bootstrapping.
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'test-audience';

@Controller('protected')
class TestController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtected(@Req() req: RequestWithUser): AuthenticatedUser {
    return req.user;
  }
}

function validPayload(): JwtPayload {
  return {
    sub: 'auth0|user-123',
    iss: 'https://test.auth0.com/',
    aud: 'test-audience',
  };
}

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

describe('JwtStrategy', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
      controllers: [TestController],
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

  it('extracts the sub claim as the authenticated user', () => {
    const strategy = app.get(JwtStrategy);
    expect(strategy.validate(validPayload())).toEqual({
      sub: 'auth0|user-123',
    });
  });

  it('validates a token with the correct issuer and audience', async () => {
    const token = signToken(validPayload());

    const response = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ sub: 'auth0|user-123' });
  });

  it('rejects a token with an invalid issuer', async () => {
    const token = signToken({
      ...validPayload(),
      iss: 'https://evil.example.com/',
    });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects a token with an invalid audience', async () => {
    const token = signToken({ ...validPayload(), aud: 'other-audience' });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects requests without a bearer token', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('is configured with the Auth0 JWKS URI and caching from env', () => {
    expect(passportJwtSecretMock).toHaveBeenCalledWith(
      expect.objectContaining({
        jwksUri: 'https://test.auth0.com/.well-known/jwks.json',
        cache: true,
        rateLimit: true,
      }),
    );
  });
});
