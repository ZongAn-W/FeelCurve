import type { Metadata } from "next";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "登录 · FeelCurve",
  description: "登录 FeelCurve 账号，继续调参和复制提示词。",
  robots: { index: false },
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;

  return (
    <AuthView
      mode="login"
      nextPath={typeof params.next === "string" ? params.next : undefined}
      initialError={typeof params.error === "string" ? params.error : undefined}
    />
  );
}
