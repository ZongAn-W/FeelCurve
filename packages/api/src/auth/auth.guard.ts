import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SESSION_COOKIE } from "./auth.constants";
import type { AuthenticatedRequest } from "./auth.types";

interface SessionPayload {
  sub?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;

    if (!token) {
      throw new UnauthorizedException("UNAUTHENTICATED");
    }

    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token);
      if (!payload.sub) {
        throw new Error("missing subject");
      }
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("UNAUTHENTICATED");
    }
  }
}
