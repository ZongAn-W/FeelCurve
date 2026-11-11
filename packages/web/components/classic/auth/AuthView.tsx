"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/Providers";
import { TopBar } from "@/components/classic/site/TopBar";
import { AuthApiError, githubLoginUrl } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";

type AuthMode = "login" | "register";

const ERROR_KEY_BY_CODE: Record<string, keyof Dictionary["auth"]> = {
  INVALID_CREDENTIALS: "errorInvalidCredentials",
  EMAIL_TAKEN: "errorEmailTaken",
  WEAK_PASSWORD: "errorWeakPassword",
  INVALID_EMAIL: "errorInvalidEmail",
  NAME_TOO_LONG: "errorNameTooLong",
  github_config: "errorGithubConfig",
  github_denied: "errorGithubDenied",
  github_state: "errorGithubState",
  github_email: "errorGithubEmail",
  github_linked: "errorGithubLinked",
  github_failed: "errorGithubFailed",
};

function translateAuthError(
  code: string | null | undefined,
  auth: Dictionary["auth"],
): string | null {
  if (!code) return null;
  const key = ERROR_KEY_BY_CODE[code];
  return key ? auth[key] : auth.errorGeneric;
}

function safeNextPath(value: string | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/classic";
  }

  // Keep post-login navigation inside the classic frontend.
  if (
    value === "/classic" ||
    value.startsWith("/classic/") ||
    value.startsWith("/classic?") ||
    value.startsWith("/classic#")
  ) {
    return value;
  }

  return `/classic${value}`;
}

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50 focus:bg-surface-3 motion-reduce:transition-none";
const labelClass = "block text-[12px] font-medium text-muted";

export function AuthView({
  mode,
  nextPath,
  initialError,
}: {
  mode: AuthMode;
  nextPath?: string;
  initialError?: string;
}) {
  const { t } = useLocale();
  const { user, loading, login, register, logout } = useAuth();
  const router = useRouter();
  const next = safeNextPath(nextPath);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    translateAuthError(initialError, t.auth),
  );

  useEffect(() => {
    setError(translateAuthError(initialError, t.auth));
  }, [initialError, t]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (mode === "register" && password !== confirmPassword) {
      setError(t.auth.errorPasswordMismatch);
      return;
    }

    setPending(true);
    setError(null);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        });
      }
      router.replace(next);
      router.refresh();
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        setError(
          translateAuthError(caught.code, t.auth) ?? t.auth.errorGeneric,
        );
      } else {
        setError(t.auth.errorNetwork);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
      router.refresh();
    } catch {
      setError(t.auth.errorNetwork);
    } finally {
      setPending(false);
    }
  }

  const isLogin = mode === "login";
  const switchHref =
    (isLogin ? "/classic/register" : "/classic/login") +
    (next !== "/classic" ? "?next=" + encodeURIComponent(next) : "");

  return (
    <div className="min-h-screen top-glow">
      <TopBar />
      <main className="relative mx-auto flex min-h-[calc(100svh_-_3.5rem)] w-full max-w-[440px] flex-col justify-center px-5 py-12 sm:px-6 sm:py-16">
        {loading ? (
          <div className="panel p-6 sm:p-8" aria-hidden>
            <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-5 h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/[0.04]" />
            <div className="mt-8 h-11 w-full animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        ) : user ? (
          <div className="panel p-6 text-center sm:p-8">
            <div className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-accent text-[18px] font-semibold text-[#171c0a] ring-1 ring-white/10">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                (user.name?.trim() || user.email).slice(0, 1).toUpperCase()
              )}
            </div>
            <p className="mono-label mt-5">{t.auth.account}</p>
            <h1 className="display mt-2 text-[28px] text-ink">
              {t.auth.signedInAs}
            </h1>
            <p className="mt-2 break-words text-[13.5px] text-muted">
              {user.name?.trim() || user.email}
            </p>
            <p className="mt-1 break-words text-[12px] text-faint">
              {user.email}
            </p>
            <div className="mt-7 grid gap-2.5">
              <Link
                href={next}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-accent text-[13.5px] font-semibold text-[#171c0a] transition-colors hover:bg-[#d9fb87] motion-reduce:transition-none"
              >
                {t.auth.continue}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-[13px] font-medium text-ink transition-colors hover:border-white/20 hover:bg-surface-3 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
              >
                {pending ? t.auth.submitting : t.auth.logout}
              </button>
            </div>
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-[#ff8a8a]/25 bg-[#ff8a8a]/[0.07] px-3.5 py-2.5 text-[12.5px] leading-5 text-[#ffb4b4]"
              >
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="panel p-6 sm:p-8">
            <p className="mono-label">{isLogin ? "SIGN IN" : "CREATE ACCOUNT"}</p>
            <h1 className="display mt-3 text-[30px] text-ink sm:text-[34px]">
              {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
            </h1>
            <p className="mt-2.5 text-[13.5px] leading-6 text-muted">
              {isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label className={labelClass} htmlFor="auth-email">
                  {t.auth.email}
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                />
              </div>

              {isLogin ? null : (
                <div>
                  <label className={labelClass} htmlFor="auth-name">
                    {t.auth.nameOptional}
                  </label>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="nickname"
                    maxLength={50}
                    placeholder={t.auth.namePlaceholder}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={fieldClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="auth-password">
                  {t.auth.password}
                </label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={isLogin ? undefined : 8}
                  maxLength={72}
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={fieldClass}
                />
              </div>

              {isLogin ? null : (
                <div>
                  <label className={labelClass} htmlFor="auth-password-confirm">
                    {t.auth.confirmPassword}
                  </label>
                  <input
                    id="auth-password-confirm"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={fieldClass}
                  />
                </div>
              )}

              {error ? (
                <p
                  id="auth-error"
                  role="alert"
                  className="rounded-xl border border-[#ff8a8a]/25 bg-[#ff8a8a]/[0.07] px-3.5 py-2.5 text-[12.5px] leading-5 text-[#ffb4b4]"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-xl bg-accent text-[13.5px] font-semibold text-[#171c0a] transition-colors hover:bg-[#d9fb87] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
              >
                {pending
                  ? t.auth.submitting
                  : isLogin
                    ? t.auth.submitLogin
                    : t.auth.submitRegister}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] text-faint">{t.auth.or}</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <a
              href={githubLoginUrl(next)}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface-2 text-[13px] font-medium text-ink transition-colors hover:border-white/20 hover:bg-surface-3 motion-reduce:transition-none"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              {t.auth.github}
            </a>

            <p className="mt-6 text-center text-[12.5px] text-muted">
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}{" "}
              <Link
                href={switchHref}
                className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:text-ink"
              >
                {isLogin ? t.auth.toRegister : t.auth.toLogin}
              </Link>
            </p>
          </div>
        )}

        <Link
          href="/classic"
          className="mt-6 text-center text-[12px] text-faint transition-colors hover:text-ink"
        >
          {t.auth.backHome}
        </Link>
      </main>
    </div>
  );
}
