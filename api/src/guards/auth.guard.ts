import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.API_SECRET;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || authHeader !== `Bearer ${this.secret}`) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    return true;
  }
}
