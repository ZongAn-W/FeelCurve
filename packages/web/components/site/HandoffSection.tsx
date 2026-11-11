"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/Providers";
import styles from "./HandoffSection.module.css";

const FEATURED = "magnetic-button";

const copy = {
  zh: {
    kicker: "提示词之后",
    title: "复制之后，\n落到你的项目里",
    subtitle: "同一份提示词，三种工作方式。完整版只新建一个文件，改造版只给建议。",
    cards: [
      {
        name: "Claude Code",
        desc: "在终端里粘贴，按文件契约落盘。",
        lines: ["$ claude", "> paste the prompt", "✓ components/effects/MagneticButton.tsx", "✓ 1 file created · 0 deps added"],
      },
      {
        name: "Cursor",
        desc: "生成 diff，确认后合并。",
        lines: ["components/effects/MagneticButton.tsx", "+148  −0", "@@ useMotionValue + animate() @@"],
      },
      {
        name: "Lovable / v0",
        desc: "对话里生成，直接看可交互预览。",
        lines: ["You: magnetic button, 140px field, 16px pull", "AI: added MagneticButton.tsx", "Preview updated ↗"],
      },
    ],
    cta: "看一个完整示例",
    ctaHint: "以磁吸按钮为例，复制提示词再粘贴给 AI。",
  },
  en: {
    kicker: "AFTER THE COPY",
    title: "Where the prompt\nlands",
    subtitle: "One prompt, three workflows. The full variant adds exactly one file; retrofit only suggests changes.",
    cards: [
      {
        name: "Claude Code",
        desc: "Paste it in the terminal and the file lands in your repo.",
        lines: ["$ claude", "> paste the prompt", "✓ components/effects/MagneticButton.tsx", "✓ 1 file created · 0 deps added"],
      },
      {
        name: "Cursor",
        desc: "Review the diff before it touches your branch.",
        lines: ["components/effects/MagneticButton.tsx", "+148  −0", "@@ useMotionValue + animate() @@"],
      },
      {
        name: "Lovable / v0",
        desc: "Generate in chat and watch the live preview.",
        lines: ["You: magnetic button, 140px field, 16px pull", "AI: added MagneticButton.tsx", "Preview updated ↗"],
      },
    ],
    cta: "Open a full example",
    ctaHint: "Start with Magnetic Button — copy the prompt and paste it into your AI.",
  },
} as const;

export function HandoffSection() {
  const { locale } = useLocale();
  const content = copy[locale];

  return (
    <section className={styles.section} aria-labelledby="handoff-title">
      <div className={`shell ${styles.inner}`}>
        <div className={styles.topline}>
          <p>04 — {locale === "zh" ? "交付" : "Handoff"}</p>
          <p>CLAUDE CODE / CURSOR / V0</p>
        </div>

        <header className={styles.head}>
          <div className={styles.kicker}>
            <p>{content.kicker}</p>
            <p className={styles.kickerIndex} aria-hidden>
              [ 03 × 01 ]
            </p>
          </div>
          <h2 id="handoff-title">
            {content.title.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={styles.subtitle}>{content.subtitle}</p>
        </header>

        <div className={styles.grid}>
          {content.cards.map((card, index) => (
            <article key={card.name} className={styles.card}>
              <div className={styles.cardTop}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{card.name}</h3>
              </div>

              <div className={styles.mock}>
                {index === 0 && (
                  <div className={styles.terminal}>
                    <p className={styles.mockLabel}>TERMINAL / 01</p>
                    {card.lines.map((line) => (
                      <p
                        key={line}
                        className={
                          line.startsWith("✓") ? styles.ok : undefined
                        }
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {index === 1 && (
                  <div className={styles.diff}>
                    <p className={styles.mockLabel}>DIFF / 02</p>
                    <p className={styles.diffFile}>{card.lines[0]}</p>
                    <p className={styles.diffStat}>{card.lines[1]}</p>
                    <p className={styles.diffHunk}>{card.lines[2]}</p>
                    <p className={styles.diffStatus}>
                      <span aria-hidden>□</span> READY TO REVIEW
                    </p>
                  </div>
                )}
                {index === 2 && (
                  <div className={styles.chat}>
                    <p className={styles.mockLabel}>CHAT / 03</p>
                    <p className={styles.bubbleUser}>{card.lines[0]}</p>
                    <p className={styles.bubbleAi}>{card.lines[1]}</p>
                    <p className={styles.chatStatus}>{card.lines[2]}</p>
                  </div>
                )}
              </div>

              <p className={styles.cardDesc}>{card.desc}</p>
            </article>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <p>{content.ctaHint}</p>
          <Link href={`/effects/${FEATURED}`} className={styles.cta}>
            <span>{content.cta}</span>
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
