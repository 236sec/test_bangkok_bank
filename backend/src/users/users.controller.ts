import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser, RequestWithUser } from '../auth/jwt.strategy';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get()
  getMe(@Req() req: RequestWithUser): AuthenticatedUser {
    return req.user;
  }
}
