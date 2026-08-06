import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import type { Request } from 'express';

/** Claims carried by a validated Auth0 access token. */
export interface JwtPayload {
  sub: string;
  iss: string;
  aud: string;
}

/** The authenticated user attached to `req.user` after validation. */
export interface AuthenticatedUser {
  sub: string;
}

/** Express request augmented with the validated JWT payload as `req.user`. */
export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const auth0Domain = configService.get<string>('AUTH0_DOMAIN');
    const auth0Audience = configService.get<string>('AUTH0_AUDIENCE');

    if (!auth0Domain || !auth0Audience) {
      throw new Error(
        'JwtStrategy requires AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // jwks-rsa 4.x integration for passport-jwt: resolves the signing key from
      // the Auth0 tenant JWKS endpoint (with caching and rate limiting), so the
      // token signature, issuer, and audience are all verified before validate().
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      }),
      issuer: `https://${auth0Domain}/`,
      audience: auth0Audience,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    // The `sub` claim is the sole source of the ownerId used to scope data.
    return { sub: payload.sub };
  }
}
