export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  github: boolean;
};

type AuthErrorBody = {
  message?: string | string[];
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

const AUTH_BASE = API_ORIGIN + "/api/auth";

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

async function readError(response: Response): Promise<AuthApiError> {
  let code = "REQUEST_FAILED";
  try {
    const body = (await response.json()) as AuthErrorBody;
    if (Array.isArray(body.message)) {
      code = body.message[0] ?? code;
    } else if (typeof body.message === "string") {
      code = body.message;
    }
  } catch {
    // Keep the generic code when the response is not JSON.
  }
  return new AuthApiError(response.status, code);
}

async function requestUser(
  path: string,
  init: RequestInit,
): Promise<AuthUser> {
  const response = await fetch(AUTH_BASE + path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await readError(response);
  }

  const body = (await response.json()) as { user: AuthUser };
  return body.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(AUTH_BASE + "/me", {
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) throw await readError(response);

  const body = (await response.json()) as { user: AuthUser };
  return body.user;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  return requestUser("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthUser> {
  return requestUser("/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(AUTH_BASE + "/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await readError(response);
  }
}

export function githubLoginUrl(nextPath: string): string {
  const next = nextPath.startsWith("/") ? nextPath : "/";
  return AUTH_BASE + "/github?next=" + encodeURIComponent(next);
}
