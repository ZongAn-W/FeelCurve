import type { Metadata } from "next";
import { AuthView } from "@/components/classic/auth/AuthView";

export const metadata: Metadata = {
  title: "注册 · FeelCurve Classic",
  description: "创建 FeelCurve 账号，保存你的调参与提示词。",
  robots: { index: false },
  alternates: { canonical: "/classic/register" },
};

export default async function ClassicRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <AuthView
      mode="register"
      nextPath={typeof params.next === "string" ? params.next : undefined}
    />
  );
}
