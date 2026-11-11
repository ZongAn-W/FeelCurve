import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_PATH,
  OAUTH_STATE_MAX_AGE_MS,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
} from "./auth.constants";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CurrentUserId } from "./current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sanitizeNext(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}

function readNextFromState(state: string): string {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { next?: unknown };
    return sanitizeNext(parsed.next);
  } catch {
    return "/";
  }
}

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.register(dto);
    this.setSessionCookie(response, session.token);
    return { user: session.user };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(dto);
    this.setSessionCookie(response, session.token);
    return { user: session.user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, this.sessionCookieOptions());
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@CurrentUserId() userId: string) {
    return { user: await this.auth.me(userId) };
  }

  @Get("github")
  github(@Query("next") next: string | undefined, @Res() response: Response) {
    const clientId = this.config.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.config.get<string>("GITHUB_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      response.redirect(this.webUrl("/login?error=github_config"));
      return;
    }

    const state = Buffer.from(
      JSON.stringify({
        nonce: randomBytes(16).toString("hex"),
        next: sanitizeNext(next),
      }),
    ).toString("base64url");

    response.cookie(OAUTH_STATE_COOKIE, state, {
      ...this.sessionCookieOptions(),
      path: OAUTH_STATE_COOKIE_PATH,
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.callbackUrl(),
      scope: "read:user user:email",
      state,
      allow_signup: "true",
    });

    response.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
    );
  }

  @Get("github/callback")
  async githubCallback(
    @Req() request: Request,
    @Res() response: Response,
    @Query("code") code?: string,
    @Query("state") state?: string,
    @Query("error") error?: string,
  ) {
    const storedState = request.cookies?.[OAUTH_STATE_COOKIE] as
      | string
      | undefined;
    response.clearCookie(OAUTH_STATE_COOKIE, {
      path: OAUTH_STATE_COOKIE_PATH,
    });

    if (error) {
      response.redirect(this.webUrl("/login?error=github_denied"));
      return;
    }

    if (
      !code ||
      !state ||
      !storedState ||
      !safeEqual(state, storedState)
    ) {
      response.redirect(this.webUrl("/login?error=github_state"));
      return;
    }

    const next = readNextFromState(state);

    try {
      const session = await this.auth.loginWithGithub(code);
      this.setSessionCookie(response, session.token);
      response.redirect(this.webUrl(next));
    } catch (caught) {
      this.logger.warn(
        `GitHub login failed: ${
          caught instanceof Error ? caught.message : String(caught)
        }`,
      );

      let errorCode = "github_failed";
      if (
        caught instanceof BadRequestException &&
        caught.message === "GITHUB_EMAIL_UNAVAILABLE"
      ) {
        errorCode = "github_email";
      } else if (caught instanceof ConflictException) {
        errorCode = "github_linked";
      }

      response.redirect(this.webUrl(`/login?error=${errorCode}`));
    }
  }

  private setSessionCookie(response: Response, token: string): void {
    response.cookie(SESSION_COOKIE, token, {
      ...this.sessionCookieOptions(),
      maxAge: SESSION_MAX_AGE_MS,
    });
  }

  private sessionCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };
  }

  private callbackUrl(): string {
    const explicit = this.config.get<string>("GITHUB_CALLBACK_URL");
    if (explicit) return explicit;

    const apiBase = (
      this.config.get<string>("API_PUBLIC_URL") ?? "http://localhost:3001"
    ).replace(/\/+$/, "");
    return `${apiBase}/api/auth/github/callback`;
  }

  private webUrl(path: string): string {
    const base = (
      this.config.get<string>("WEB_APP_URL") ?? "http://localhost:3000"
    ).replace(/\/+$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }
}
