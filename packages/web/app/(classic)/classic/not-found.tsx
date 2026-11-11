import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 · 这个效果不存在 — FeelCurve",
  description: "这个地址没有对应的动效，回首页或继续逛效果库。",
  robots: { index: false, follow: false },
  alternates: null,
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-void">
      <div
        aria-hidden
        className="top-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-35 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_20%,transparent_100%)]"
      />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-[1240px] items-center px-5 sm:px-6">
        <a
          href="/classic"
          aria-label="FeelCurve 首页"
          className="flex min-h-11 items-center gap-2.5 rounded-sm"
        >
          <span className="relative grid h-6 w-6 place-items-center rounded-[7px] bg-accent">
            <span className="absolute h-1 w-1 rounded-full bg-[#0A0B08]" />
            <span className="absolute h-1 w-1 translate-x-[5px] translate-y-[5px] rounded-full bg-[#0A0B08]/70" />
            <span className="absolute h-1 w-1 -translate-x-[5px] translate-y-[5px] rounded-full bg-[#0A0B08]/40" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold tracking-tight">FeelCurve</span>
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint min-[400px]:inline">
              Motion, copied as prompts.
            </span>
          </span>
        </a>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 items-center px-5 py-16 sm:px-6 sm:py-24">
        <div className="w-full max-w-[720px]">
          <p className="mono-label">Error 404 — Signal lost</p>

          <h1 className="display mt-5 text-[clamp(3.5rem,10vw,7rem)] text-ink">
            404
            <span className="mt-2 block text-[clamp(1.25rem,3.2vw,2rem)] tracking-[-0.03em] text-muted">
              <span className="text-accent">/</span> 这个效果不存在
            </span>
          </h1>

          <p className="mt-7 max-w-[520px] text-[14px] leading-7 text-muted sm:text-[15px]">
            这个地址没有对应的动效。可能是链接写错了，或者它已经被移走。
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row">
            <a
              href="/classic"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-[13px] font-semibold text-[#0A0B08] transition-colors hover:bg-[#d8ff79] motion-reduce:transition-none"
            >
              回首页
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="/classic#effects"
              className="hairline inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/[0.02] px-5 text-[13px] font-medium text-ink transition-colors hover:bg-white/[0.06] motion-reduce:transition-none"
            >
              逛效果库
              <span aria-hidden className="font-mono text-[11px] text-faint">
                ↗
              </span>
            </a>
          </div>

          <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            FeelCurve / effects library
          </p>
        </div>
      </main>
    </div>
  );
}
