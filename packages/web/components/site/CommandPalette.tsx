"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/Providers";
import { liveModules } from "@/content/effects/registry";
import { effectGroups, getEffectGroup } from "@/lib/effect-catalog";
import styles from "./CommandPalette.module.css";

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="m10.6 10.6 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CommandPalette() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return liveModules.filter(({ spec }) => {
      if (!needle) return true;
      return [
        spec.name.zh,
        spec.name.en,
        spec.tagline.zh,
        spec.tagline.en,
        ...spec.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`command-item-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function select(slug: string) {
    close();
    router.push(`/effects/${slug}`);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const next = results[active];
      if (next) select(next.spec.slug);
    }
  }

  const dialog =
    mounted && open
      ? createPortal(
          <div className={styles.overlay} onMouseDown={close}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.command.label}
              className={styles.panel}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.inputRow}>
                <SearchIcon size={16} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t.command.placeholder}
                  aria-controls="command-results"
                  aria-activedescendant={results[active] ? `command-item-${active}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" className={styles.esc} onClick={close}>
                  Esc
                </button>
              </div>

              <div id="command-results" role="listbox" aria-label={t.command.label} className={styles.list}>
                {results.length === 0 ? (
                  <p className={styles.empty}>{t.command.empty}</p>
                ) : (
                  results.map(({ spec }, index) => {
                    const group = effectGroups.find(({ id }) => id === getEffectGroup(spec));
                    return (
                      <button
                        key={spec.slug}
                        id={`command-item-${index}`}
                        type="button"
                        role="option"
                        aria-selected={index === active}
                        className={styles.item}
                        data-active={index === active}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => select(spec.slug)}
                      >
                        <span className={styles.itemMain}>
                          <span className={styles.itemName}>{spec.name[locale]}</span>
                          <span className={styles.itemTagline}>{spec.tagline[locale]}</span>
                        </span>
                        <span className={styles.itemMeta}>
                          {group?.label[locale]}
                          <span aria-hidden>→</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className={styles.footer}>
                <span>{t.command.hint}</span>
                <span>
                  {results.length} {t.command.results}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t.command.label}
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
        <span className={styles.triggerLabel}>{t.nav.search}</span>
        <kbd className={styles.triggerKbd}>⌘K</kbd>
      </button>
      {dialog}
    </>
  );
}
