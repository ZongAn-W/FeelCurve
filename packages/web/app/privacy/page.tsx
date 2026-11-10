import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/site/TopBar";
import { ICP_LICENSE, ICP_LICENSE_URL } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "隐私说明 · FeelCurve",
  description:
    "FeelCurve 的隐私说明：访问日志、匿名访问统计与错误上报的实际处理情况。",
  robots: { index: false },
  alternates: { canonical: "/privacy" },
};

// 隐私联系邮箱。
const CONTACT_EMAIL = "3032441139@qq.com";

const sectionClass = "border-t border-line pt-6";
const headingClass = "text-[18px] font-medium tracking-[-0.01em] text-ink";
const bodyClass = "mt-3 text-[14px] leading-7 text-muted";
const listClass = "mt-3 list-disc space-y-2 pl-5 text-[14px] leading-7 text-muted marker:text-accent";
const linkClass =
  "break-words text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-ink";
const codeClass =
  "rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-ink";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto w-full max-w-[860px] px-5 pb-20 pt-12 sm:px-6 sm:pt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
          Privacy
        </p>
        <h1 className="mt-4 text-[32px] font-medium tracking-[-0.03em] text-ink sm:text-[40px]">
          隐私说明
        </h1>
        <p className="mt-3 text-[13px] text-faint">
          最近更新：
          <time dateTime="2026-11-10">2026-11-10</time>
        </p>
        <p className="mt-6 max-w-[68ch] text-[14px] leading-7 text-muted">
          本页说明 FeelCurve（https://feelcurve.com）当前实际处理的数据。本站不需要登录，不提供账号、支付或上传功能；提示词正文和源码不会发送到统计或错误上报服务。
        </p>

        <div className="mt-10 space-y-9">
          <section className={sectionClass}>
            <h2 className={headingClass}>1. 访问日志</h2>
            <p className={bodyClass}>
              站点由 Nginx 提供服务，会记录访问时间、IP 地址、请求路径、HTTP 状态、来源页面以及浏览器/设备信息。这些日志用于安全防护、故障排查和了解站点可用性。
            </p>
            <p className={bodyClass}>
              保留期：Nginx 日志按日轮转，保留 14 个归档，约 15 天；应用进程日志由 PM2 轮转，最多保留 14 个文件，单文件上限 10MB。
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>2. 匿名访问统计（当前启用）</h2>
            <p className={bodyClass}>
              本站使用 Umami Cloud 统计页面访问，记录页面路径、来源、浏览器/操作系统、国家或地区，以及复制提示词时的
              <code className={codeClass}>copy_prompt</code>
              事件。该事件只包含效果标识、复制入口、技术栈、版本和提示词语言，不包含提示词正文、源码、邮箱或账号信息。
            </p>
            <p className={bodyClass}>
              用途是了解哪些效果和页面被使用，以改进内容与交互。Umami 不使用 Cookie 做跨站跟踪；Umami Cloud 的 Hobby 计划保留统计数据 6 个月。
            </p>
            <p className={bodyClass}>
              第三方：Umami Cloud（
              <a
                className={linkClass}
                href="https://umami.is/"
                target="_blank"
                rel="noreferrer noopener"
              >
                umami.is
              </a>
              ）。
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>3. 错误上报（当前未启用）</h2>
            <p className={bodyClass}>
              代码中已预留 Sentry 错误上报，但当前 DSN 为空，因此不会向 Sentry 发送错误。未来如启用，异常时可能发送错误堆栈、页面 URL、浏览器/设备信息；配置为不采集用户信息、不采集请求体，也不主动附加提示词或源码。保留期以 Sentry 项目设置为准。
            </p>
            <p className={bodyClass}>
              第三方：Sentry（
              <a
                className={linkClass}
                href="https://sentry.io/"
                target="_blank"
                rel="noreferrer noopener"
              >
                sentry.io
              </a>
              ，当前未启用）。
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>4. 主机与第三方服务</h2>
            <p className={bodyClass}>
              站点运行在阿里云 ECS 上；主机商可能按云服务条款处理基础网络与安全日志。除上文列出的 Umami Cloud、Sentry 和阿里云外，本站没有接入广告、画像或其他第三方跟踪服务。
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>5. 联系</h2>
            <p className={bodyClass}>
              如对数据处理有疑问，可发送邮件至{" "}
              <a className={linkClass} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              。
            </p>
            <p className={bodyClass}>
              如果你主动发邮件，我们会收到你的邮箱地址和邮件内容，仅用于回复该问题。
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[12px] text-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/" className="transition-colors hover:text-ink">
              回首页
            </Link>
            <Link href="/#effects" className="transition-colors hover:text-ink">
              效果库
            </Link>
          </div>
          <a
            href={ICP_LICENSE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-ink"
          >
            {ICP_LICENSE}
          </a>
        </div>
      </main>
    </div>
  );
}
