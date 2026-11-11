"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/Providers";
import type { AuthUser } from "@/lib/auth";
import styles from "./AccountMenu.module.css";

export function AccountMenu({ user }: { user: AuthUser }) {
  const { logout } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const label = user.name?.trim() || user.email.split("@")[0] || user.email;
  const initial = label.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await logout();
      setOpen(false);
      router.refresh();
    } catch {
      setError(t.auth.errorNetwork);
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={containerRef} className={styles.root}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.auth.account}
        aria-expanded={open}
        aria-haspopup="true"
        className={styles.trigger}
      >
        {user.avatarUrl ? (
          // Remote avatar from GitHub; next/image would need a host allowlist.
          <img
            src={user.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className={styles.avatar}
          />
        ) : (
          <span className={styles.initial}>{initial}</span>
        )}
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="m2.5 4.5 3.5 3 3.5-3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {open ? (
        <div className={styles.menu}>
          <div className={styles.identity}>
            <p className={styles.name}>{label}</p>
            <p className={styles.email}>{user.email}</p>
            {user.github ? <p className={styles.github}>GITHUB / VERIFIED</p> : null}
          </div>
          <div className={styles.separator} />
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            className={styles.logout}
          >
            {pending ? t.auth.submitting : t.auth.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
