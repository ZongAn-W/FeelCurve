import type { Metadata } from "next";
import { TopBar } from "@/components/site/TopBar";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "404 · 这个效果不存在 — FeelCurve",
  description: "这个地址没有对应的动效，回首页或继续逛效果库。",
  robots: { index: false, follow: false },
  alternates: null,
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <TopBar />
      <main className={styles.main}>
        <div className={styles.topline}>
          <span>
            <strong>ERROR 404</strong> / SIGNAL LOST
          </span>
          <span>ZÜRICH / SHANGHAI · 2026</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.code} aria-label="404">
            <span>4</span>
            <span>0</span>
            <span className={styles.mark}>4</span>
          </div>

          <div className={styles.copy}>
            <h1>
              <span>这个效果</span>
              <span>不存在。</span>
            </h1>
            <p>
              这个地址没有对应的动效。可能是链接写错了，或者它已经被移走。回到首页，或者从效果库重新挑一个。
            </p>
            <div className={styles.actions}>
              <a href="/" className={styles.action}>
                回首页
              </a>
              <a href="/#effects" className={styles.action}>
                逛效果库
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            <strong>FEELCURVE</strong> / EFFECTS LIBRARY
          </span>
          <span>404 — PAGE NOT FOUND</span>
          <span>ZÜRICH · SHANGHAI / 2026</span>
        </div>
      </main>
    </div>
  );
}
