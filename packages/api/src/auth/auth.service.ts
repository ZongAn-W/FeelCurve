import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { PublicUser, SessionResult } from "./auth.types";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

const BCRYPT_ROUNDS = 12;
// 固定假哈希：邮箱不存在时也执行一次 compare，避免通过响应时间枚举账号。
const DUMMY_PASSWORD_HASH =
  "$2b$12$7DGv418nE.Yj8DhUMsaaue7qKXHebnMht9vBaGWiIpCFD.DgiVDKC";

interface GithubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GithubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
}

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

interface GithubProfile {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<SessionResult> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("EMAIL_TAKEN");
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password,
          name: dto.name?.trim() || null,
        },
      });
      return this.issueSession(user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException("EMAIL_TAKEN");
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<SessionResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!user?.password || !passwordMatches) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    return this.issueSession(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("UNAUTHENTICATED");
    }
    return this.toPublicUser(user);
  }

  async loginWithGithub(code: string): Promise<SessionResult> {
    const profile = await this.fetchGithubProfile(code);
    if (!profile.email) {
      throw new BadRequestException("GITHUB_EMAIL_UNAVAILABLE");
    }

    let user = await this.prisma.user.findUnique({
      where: { githubId: profile.id },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
      return this.issueSession(user);
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (byEmail) {
      if (byEmail.githubId && byEmail.githubId !== profile.id) {
        throw new ConflictException("GITHUB_ALREADY_LINKED");
      }
      user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          githubId: profile.id,
          name: byEmail.name ?? profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
      return this.issueSession(user);
    }

    try {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          githubId: profile.id,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      // 并发注册时另一请求可能已经创建；以 githubId 为准重新取一次。
      user = await this.prisma.user.findUnique({
        where: { githubId: profile.id },
      });
      if (!user) {
        throw new ConflictException("GITHUB_LINK_FAILED");
      }
    }

    return this.issueSession(user);
  }

  private async issueSession(user: User): Promise<SessionResult> {
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user: this.toPublicUser(user) };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasPassword: Boolean(user.password),
      github: Boolean(user.githubId),
    };
  }

  private getGithubCredentials(): { clientId: string; clientSecret: string } {
    const clientId = this.config.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.config.get<string>("GITHUB_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new BadRequestException("GITHUB_NOT_CONFIGURED");
    }
    return { clientId, clientSecret };
  }

  private async fetchGithubProfile(code: string): Promise<GithubProfile> {
    const { clientId, clientSecret } = this.getGithubCredentials();

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "FeelCurve",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new BadRequestException("GITHUB_TOKEN_EXCHANGE_FAILED");
    }

    const tokenData = (await tokenResponse.json()) as GithubTokenResponse;
    if (!tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error ?? "GITHUB_TOKEN_EXCHANGE_FAILED",
      );
    }

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "FeelCurve",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const userResponse = await fetch("https://api.github.com/user", {
      headers,
    });
    if (!userResponse.ok) {
      throw new BadRequestException("GITHUB_USER_FETCH_FAILED");
    }
    const githubUser = (await userResponse.json()) as GithubUserResponse;

    let email: string | null = null;
    try {
      const emailsResponse = await fetch(
        "https://api.github.com/user/emails",
        { headers },
      );
      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as GithubEmail[];
        if (Array.isArray(emails)) {
          const verified = emails.filter((item) => item.verified);
          email =
            verified.find((item) => item.primary)?.email ??
            verified[0]?.email ??
            null;
        }
      }
    } catch (error) {
      this.logger.warn(
        `GitHub email lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 只接受 GitHub 验证过的邮箱，避免用未验证地址关联本地账号。

    return {
      id: String(githubUser.id),
      login: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url,
      email: email ? email.trim().toLowerCase() : null,
    };
  }
}
