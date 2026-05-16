export function railwayBase(): string {
  return (
    process.env.RAILWAY_AGENT_URL || "https://cineminha-production.up.railway.app"
  ).replace(/\/+$/, "");
}

export async function proxyRailway(
  path: string,
  init: { method: string; body?: string }
): Promise<{ status: number; body: string; contentType: string }> {
  const url = `${railwayBase()}/${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    method: init.method,
    headers: { "Content-Type": "application/json" },
    body: init.body,
  });
  return {
    status: response.status,
    body: await response.text(),
    contentType: response.headers.get("content-type") || "application/json",
  };
}
