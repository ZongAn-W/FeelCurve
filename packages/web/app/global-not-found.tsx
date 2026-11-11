import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 · 页面不存在 — FeelCurve",
  description: "这个地址没有对应的页面。返回新版或经典版首页。",
  robots: { index: false, follow: false },
};

const styles = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    min-height: 100svh;
    background: #f2efe8;
    color: #111111;
    font-family: "Helvetica Neue", Helvetica, Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; text-decoration: none; }
  .page {
    display: flex;
    min-height: 100svh;
    flex-direction: column;
    padding: 0 clamp(18px, 3.4vw, 54px);
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    border-bottom: 1px solid #111111;
    padding: 17px 0 9px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .top .red { color: #da291c; }
  .top .muted { color: rgba(17,17,17,.48); font-weight: 400; }
  .body {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-content: center;
    gap: clamp(14px, 2.4vw, 36px);
    padding: clamp(70px, 12vw, 160px) 0;
  }
  .number {
    grid-column: 1 / span 7;
    margin: 0;
    font-size: clamp(112px, 21vw, 300px);
    font-weight: 700;
    line-height: .72;
    letter-spacing: -.1em;
    white-space: nowrap;
  }
  .number span { color: #da291c; }
  .copy {
    grid-column: 8 / span 5;
    align-self: end;
    border-top: 1px solid #111111;
    padding-top: 14px;
  }
  h1 {
    margin: 0;
    font-size: clamp(32px, 3.2vw, 48px);
    font-weight: 700;
    line-height: 1.02;
    letter-spacing: -.05em;
  }
  h1 span { display: block; }
  p {
    max-width: 34ch;
    margin: 18px 0 0;
    color: rgba(17,17,17,.62);
    font-size: 14px;
    line-height: 1.8;
  }
  .actions {
    display: grid;
    gap: 8px;
    margin-top: 26px;
  }
  .actions a {
    display: flex;
    min-height: 44px;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #111111;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: .03em;
    text-transform: uppercase;
  }
  .actions a:first-child { background: #da291c; color: #f2efe8; }
  .actions a:last-child { background: #111111; color: #f2efe8; }
  .actions a span { font-size: 14px; font-weight: 400; }
  .bottom {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 24px;
    border-top: 1px solid #111111;
    padding: 12px 0 18px;
    color: rgba(17,17,17,.46);
    font-size: 10px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  @media (max-width: 760px) {
    .number { grid-column: 1 / -1; font-size: clamp(100px, 34vw, 190px); }
    .copy { grid-column: 1 / -1; }
    .body { align-content: start; }
  }
`;

export default function GlobalNotFound() {
  return (
    <html lang="zh-CN">
      <head>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <main className="page">
          <div className="top">
            <span>
              <span className="red">404 / NOT FOUND</span> — FEELCURVE
            </span>
            <span className="muted">ZÜRICH / SHANGHAI — 2026</span>
          </div>

          <div className="body">
            <p className="number" aria-hidden="true">
              4<span>0</span>4
            </p>
            <div className="copy">
              <h1>
                <span>这个页面</span>
                <span style={{ color: "#da291c" }}>不存在。</span>
              </h1>
              <p>
                地址可能写错了，或者页面已经移动。你可以回到新版界面，或者继续使用经典版界面。
              </p>
              <div className="actions">
                <a href="/">
                  新版首页
                </a>
                <a href="/classic">
                  经典版首页
                </a>
              </div>
            </div>
          </div>

          <div className="bottom">
            <span>FEELCURVE / 404</span>
            <span>MOTION / PROMPT / 2026</span>
          </div>
        </main>
      </body>
    </html>
  );
}
