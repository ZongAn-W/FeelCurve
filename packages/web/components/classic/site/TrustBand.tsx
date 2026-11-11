"use client";

import { useLocale } from "@/components/providers/Providers";
import styles from "./TrustBand.module.css";

const copy = {
  zh: {
    kicker: "不是效果描述，是一份可执行的工程需求",
    items: [
      {
        title: "数字规格",
        desc: "每个像素、每段时长都从同一份参数源生成。滑块动过，提示词里的数字就跟着动。",
      },
      {
        title: "文件契约",
        desc: "只许新建一个文件、限定依赖白名单，不顺手改你的全局样式，也不装无关的包。",
      },
      {
        title: "验收清单",
        desc: "末尾强制 AI 逐条自检布局位移、键盘可用、reduced-motion 与移动端行为。",
      },
    ],
  },
  en: {
    kicker: "Not an effect description — an executable engineering brief",
    items: [
      {
        title: "Numeric spec",
        desc: "Every pixel and duration comes from one params source. Move a slider and the numbers in the prompt move with it.",
      },
      {
        title: "File contract",
        desc: "One named file, a dependency whitelist. No rewriting your global styles, no stray packages.",
      },
      {
        title: "Acceptance list",
        desc: "The AI must self-check layout shift, keyboard access, reduced motion and mobile behavior before it answers.",
      },
    ],
  },
} as const;

export function TrustBand() {
  const { locale } = useLocale();
  const content = copy[locale];

  return (
    <section className={styles.band} aria-label={locale === "zh" ? "提示词的三个保证" : "Three guarantees in every prompt"}>
      <div className={styles.inner}>
        <p className={styles.kicker}>{content.kicker}</p>
        <dl className={styles.items}>
          {content.items.map((item) => (
            <div key={item.title} className={styles.item}>
              <dt>{item.title}</dt>
              <dd>{item.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
