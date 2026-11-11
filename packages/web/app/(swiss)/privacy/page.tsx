import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/site/TopBar";
import { ICP_LICENSE, ICP_LICENSE_URL } from "@/lib/site-info";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "隐私说明 · FeelCurve",
  description:
    "FeelCurve 的隐私说明：访问日志、匿名访问统计与错误上报的实际处理情况。",
  robots: { index: false },
  alternates: { canonical: "/privacy" },
};

// 隐私联系邮箱。
const CONTACT_EMAIL = "3032441139@qq.com";

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <TopBar />
      <main className={styles.main}>
        <div className={styles.topline}>
          <span>
            <strong>07 — PRIVACY</strong> / 隐私说明
          </span>
          <span>ZÜRICH / SHANGHAI · 2026</span>
        </div>

        <div className={styles.layout}>
          <header className={styles.head}>
            <h1>
              隐私
              <span>PRIVACY / DATA</span>
            </h1>
            <p className={styles.updated}>
              最近更新：
              <time dateTime="2026-11-11">2026-11-11</time>
            </p>
            <div className={styles.backlinks}>
              <Link href="/">
                回首页
              </Link>
              <Link href="/#effects">
                效果库
              </Link>
            </div>
          </header>

          <div className={styles.content}>
            <p className={styles.intro}>
              本页说明 FeelCurve（https://feelcurve.com）当前实际处理的数据。浏览、调参和复制提示词不要求登录；你可以选择用邮箱密码或 GitHub 创建账号。本站不提供支付或上传功能，提示词正文和源码不会发送到统计或错误上报服务。
            </p>

            <section className={styles.section}>
              <span className={styles.sectionNum}>01</span>
              <div>
                <h2>账号与登录（可选）</h2>
                <div className={styles.body}>
                  <p>
                    不登录也可以使用效果库、调参和复制提示词。注册或登录时，我们会处理以下数据：
                  </p>
                  <ul className={styles.list}>
                    <li>
                      邮箱地址。使用邮箱注册时，还会保存你填写的昵称（可选）和密码哈希（bcrypt）；本站不保存明文密码。
                    </li>
                    <li>
                      使用 GitHub 登录时，从 GitHub 接收账号 ID、已验证邮箱、昵称和头像地址，用于创建或关联账号。授权过程会将浏览器跳转到 GitHub，GitHub 对数据的处理适用其隐私政策。
                    </li>
                    <li>
                      登录会话 Cookie <code className={styles.code}>fc_session</code>
                      （httpOnly、SameSite=Lax，有效期 7 天），以及 GitHub 授权过程中的临时 Cookie{" "}
                      <code className={styles.code}>fc_github_state</code>
                      （10 分钟）。它们只用于保持登录和防止授权请求被伪造，不用于广告跟踪。
                    </li>
                    <li>
                      账号数据用于识别账号和保持登录状态；除法律要求或保障服务安全外，不会出售或分享给第三方。
                    </li>
                    <li>
                      账号数据保留至你要求删除账号。可发送邮件至下方联系邮箱申请删除，删除后无法恢复。目前暂未提供邮箱验证、找回密码或账号自助删除功能。
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionNum}>02</span>
              <div>
                <h2>访问日志</h2>
                <div className={styles.body}>
                  <p>
                    站点由 Nginx 提供服务，会记录访问时间、IP
                    地址、请求路径、HTTP 状态、来源页面以及浏览器/设备信息。这些日志用于安全防护、故障排查和了解站点可用性。
                  </p>
                  <p>
                    保留期：Nginx
                    日志按日轮转，保留 14 个归档，约 15 天；应用进程日志由 PM2
                    轮转，最多保留 14 个文件，单文件上限 10MB。
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionNum}>03</span>
              <div>
                <h2>匿名访问统计（当前启用）</h2>
                <div className={styles.body}>
                  <p>
                    本站使用 Umami Cloud
                    统计页面访问，记录页面路径、来源、浏览器/操作系统、国家或地区，以及复制提示词时的
                    <code className={styles.code}>copy_prompt</code>
                    事件。该事件只包含效果标识、复制入口、技术栈、版本和提示词语言，不包含提示词正文、源码、邮箱或账号信息。
                  </p>
                  <p>
                    用途是了解哪些效果和页面被使用，以改进内容与交互。Umami
                    不使用 Cookie 做跨站跟踪；Umami Cloud 的 Hobby 计划保留统计数据 6 个月。
                  </p>
                  <p>
                    第三方：Umami Cloud（
                    <a
                      className={styles.link}
                      href="https://umami.is/"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      umami.is
                    </a>
                    ）。
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionNum}>04</span>
              <div>
                <h2>错误上报（当前未启用）</h2>
                <div className={styles.body}>
                  <p>
                    代码中已预留 Sentry
                    错误上报，但当前 DSN 为空，因此不会向 Sentry
                    发送错误。未来如启用，异常时可能发送错误堆栈、页面
                    URL、浏览器/设备信息；配置为不采集用户信息、不采集请求体，也不主动附加提示词或源码。保留期以
                    Sentry 项目设置为准。
                  </p>
                  <p>
                    第三方：Sentry（
                    <a
                      className={styles.link}
                      href="https://sentry.io/"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      sentry.io
                    </a>
                    ，当前未启用）。
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionNum}>05</span>
              <div>
                <h2>主机与第三方服务</h2>
                <div className={styles.body}>
                  <p>
                    站点运行在阿里云 ECS
                    上；主机商可能按云服务条款处理基础网络与安全日志。使用 GitHub
                    登录时，GitHub
                    会作为第三方身份提供方参与（见第 1 节）。除上文列出的 Umami
                    Cloud、Sentry、GitHub 和阿里云外，本站没有接入广告、画像或其他第三方跟踪服务。
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <span className={styles.sectionNum}>06</span>
              <div>
                <h2>联系</h2>
                <div className={styles.body}>
                  <p>
                    如对数据处理有疑问，可发送邮件至{" "}
                    <a
                      className={styles.link}
                      href={`mailto:${CONTACT_EMAIL}`}
                    >
                      {CONTACT_EMAIL}
                    </a>
                    。
                  </p>
                  <p>
                    如果你主动发邮件，我们会收到你的邮箱地址和邮件内容，仅用于回复该问题。
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={styles.bottom}>
          <div>
            <Link href="/">回首页</Link>
            <Link href="/#effects">效果库</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
          <a
            href={ICP_LICENSE_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            {ICP_LICENSE}
          </a>
        </div>
      </main>
    </div>
  );
}
