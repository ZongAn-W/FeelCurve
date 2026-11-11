"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/Providers";
import type { AuthUser } from "@/lib/auth";

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.auth.account}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-8 items-center gap-1.5 rounded-lg px-1 transition-colors hover:bg-white/[0.06] motion-reduce:transition-none"
      >
        {user.avatarUrl ? (
          // Remote avatar from GitHub; next/image would need a host allowlist.
          <img
            src={user.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-[#171c0a]">
            {initial}
          </span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className="hidden text-faint sm:block"
        >
          <path
            d="m2.5 4.5 3.5 3 3.5-3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-xl border border-line bg-surface/95 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="px-2.5 py-2">
            <p className="truncate text-[13px] font-medium text-ink">{label}</p>
            <p className="mt-0.5 truncate text-[11.5px] text-faint">{user.email}</p>
            {user.github ? (
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent-dim">
                GitHub
              </p>
            ) : null}
          </div>
          <div className="my-1 h-px bg-line" />
          {error ? (
            <p className="px-2.5 pb-1.5 text-[11px] leading-4 text-[#ffb4b4]">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            className="w-full rounded-lg px-2.5 py-2 text-left text-[12.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {pending ? t.auth.submitting : t.auth.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
