import type { Metadata } from "next";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "注册 · FeelCurve",
  description: "创建 FeelCurve 账号，保存你的调参与提示词。",
  robots: { index: false },
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({
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
