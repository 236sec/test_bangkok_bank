import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Per-route guard validating the `Authorization: Bearer <token>` credential
 * against the Auth0 tenant JWKS endpoint. Applied with @UseGuards on
 * individual controllers/routes — the only unauthenticated route is /health.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
