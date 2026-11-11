import type { Request } from "express";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  github: boolean;
}

export interface SessionResult {
  token: string;
  user: PublicUser;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
