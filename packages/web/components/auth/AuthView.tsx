"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/Providers";
import { TopBar } from "@/components/site/TopBar";
import { AuthApiError, githubLoginUrl } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";
import styles from "./AuthView.module.css";

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
    return "/";
  }
  return value;
}

export function AuthView({
  mode,
  nextPath,
  initialError,
}: {
  mode: AuthMode;
  nextPath?: string;
  initialError?: string;
}) {
  const { locale, t } = useLocale();
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
    (isLogin ? "/register" : "/login") +
    (next !== "/" ? "?next=" + encodeURIComponent(next) : "");

  return (
    <div className={styles.page}>
      <TopBar />
      <main className={`shell ${styles.main}`}>
        <header className={styles.head}>
          <div className={styles.topline}>
            <span>07 — ACCESS / {locale === "zh" ? "账户" : "Account"}</span>
            <strong>{isLogin ? "SIGN IN" : "CREATE ACCOUNT"}</strong>
          </div>
          <p className={styles.index}>[ 01 / {t.auth.account} ]</p>
          <h1
            className={`${styles.title} ${locale === "en" ? styles.titleEnglish : ""}`}
          >
            {user
              ? t.auth.signedInAs
              : isLogin
                ? t.auth.loginTitle
                : t.auth.registerTitle}
          </h1>
          <p className={styles.subtitle}>
            {user
              ? t.auth.account
              : isLogin
                ? t.auth.loginSubtitle
                : t.auth.registerSubtitle}
          </p>
          <div className={styles.rules} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <Link href="/" className={styles.back}>
            {t.auth.backHome}
          </Link>
        </header>

        <section className={styles.panel} aria-label={t.auth.account}>
          <div className={styles.panelTop}>
            <span>{isLogin ? "SIGN IN / FORM" : "REGISTER / FORM"}</span>
            <span>2026 — 01</span>
          </div>

          {loading ? (
            <div className={styles.loading} aria-hidden>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : user ? (
            <>
              <div className={styles.account}>
                <div className={styles.avatar} aria-hidden>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (user.name?.trim() || user.email).slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className={styles.accountLabel}>{t.auth.account}</p>
                  <h2 className={styles.accountTitle}>{t.auth.signedInAs}</h2>
                  <p className={styles.accountName}>
                    {user.name?.trim() || user.email}
                  </p>
                  <p className={styles.accountEmail}>{user.email}</p>
                </div>
              </div>

              <div className={styles.accountActions}>
                <Link href={next} className={styles.continue}>
                  {t.auth.continue}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={pending}
                  className={styles.logout}
                >
                  {pending ? t.auth.submitting : t.auth.logout}
                </button>
              </div>

              {error ? (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-email">
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
                    className={styles.input}
                  />
                </div>

                {isLogin ? null : (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="auth-name">
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
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-password">
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
                    className={styles.input}
                  />
                </div>

                {isLogin ? null : (
                  <div className={styles.field}>
                    <label
                      className={styles.label}
                      htmlFor="auth-password-confirm"
                    >
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
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                )}

                {error ? (
                  <p id="auth-error" role="alert" className={styles.error}>
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className={styles.submit}
                >
                  {pending
                    ? t.auth.submitting
                    : isLogin
                      ? t.auth.submitLogin
                      : t.auth.submitRegister}
                </button>
              </form>

              <div className={styles.or}>{t.auth.or}</div>

              <a href={githubLoginUrl(next)} className={styles.github}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                {t.auth.github}
              </a>

              <p className={styles.switch}>
                {isLogin ? t.auth.noAccount : t.auth.hasAccount}{" "}
                <Link href={switchHref}>
                  {isLogin ? t.auth.toRegister : t.auth.toLogin}
                </Link>
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
