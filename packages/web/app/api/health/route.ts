// 公开健康检查：只返回存活状态，不暴露提交号、环境变量或主机名。
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
