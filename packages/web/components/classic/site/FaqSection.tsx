"use client";

import { useLocale } from "@/components/providers/Providers";
import styles from "./FaqSection.module.css";

const REPO_ISSUES = "https://github.com/ZongAn-W/FeelCurve/issues";

const copy = {
  zh: {
    kicker: "FAQ",
    title: "复制之前，\n你可能想问",
    note: "还有问题？",
    link: "在 GitHub 开一个 issue",
    items: [
      {
        q: "免费吗？需要登录吗？",
        a: "免费，复制次数不限，不登录也能用。登录是可选的，目前用于识别账号和保持登录状态，不会限制复制。所有效果、参数和提示词都在浏览器里生成。",
      },
      {
        q: "复制完之后怎么用？",
        a: "粘贴给 Claude Code、Cursor 或任何能写代码的 AI。完整版会按文件契约只新建一个文件；改造版会先读你贴进去的源码，再给最小改动方案。",
      },
      {
        q: "为什么提示词里全是数字？",
        a: "这些数字就是你在页面上调出来的手感。提示词会明确要求 AI 不要改这些值，否则效果就不再是你挑中的那一个。",
      },
      {
        q: "支持我的技术栈吗？",
        a: "内置 React + Tailwind + Motion、Vue 3、原生 ES Module 和 GSAP 四种。不确定时可以选「通用」，让 AI 先检查你项目的依赖和构建方式再动手。",
      },
      {
        q: "会不会改坏我的项目？",
        a: "完整版只允许新建指定文件、限定依赖白名单，不碰全局样式。改造版只给改动建议，只有你粘贴源码时才会引用现有代码。",
      },
    ],
  },
  en: {
    kicker: "FAQ",
    title: "Before you copy,\nyou might ask",
    note: "Something else?",
    link: "Open an issue on GitHub",
    items: [
      {
        q: "Is it free? Do I need an account?",
        a: "Free, with no copy limit — no account required. Signing in is optional; it currently identifies your account and keeps you signed in, and never limits copying. Every effect, parameter and prompt is generated in your browser.",
      },
      {
        q: "What do I do after copying?",
        a: "Paste it into Claude Code, Cursor or any coding agent. The full variant creates exactly one file under the file contract; retrofit reads the source you paste and proposes the smallest diff.",
      },
      {
        q: "Why is the prompt full of numbers?",
        a: "Those numbers are the feel you just tuned. The prompt explicitly tells the AI not to change them — otherwise the result is no longer the effect you picked.",
      },
      {
        q: "Does it support my stack?",
        a: "React + Tailwind + Motion, Vue 3, vanilla ES modules and GSAP are built in. If you are unsure, choose Universal and the AI inspects your project first.",
      },
      {
        q: "Can it break my project?",
        a: "The full variant may only add the named file and use whitelisted dependencies; it never touches global styles. Retrofit only suggests changes and quotes your source when you paste it.",
      },
    ],
  },
} as const;

export function FaqSection() {
  const { locale } = useLocale();
  const content = copy[locale];

  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.kicker}>{content.kicker}</p>
          <h2 id="faq-title">
            {content.title.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={styles.note}>
            {content.note}{" "}
            <a href={REPO_ISSUES} target="_blank" rel="noreferrer noopener">
              {content.link}
            </a>
          </p>
        </header>

        <div className={styles.items}>
          {content.items.map((item) => (
            <details key={item.q} className={styles.item}>
              <summary>
                <span>{item.q}</span>
                <span className={styles.plus} aria-hidden />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}