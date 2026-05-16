export const config = {
  runtime: "edge",
};

const RAILWAY_BASE = (
  process.env.RAILWAY_AGENT_URL || "https://cineminha-production.up.railway.app"
).replace(/\/+$/, "");

/**
 * Proxy serverless: /api/agent/* → Railway (POST preservado; rewrites da Vercel falham com 405).
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const { pathname } = new URL(request.url);
  const subPath = pathname.replace(/^\/api\/agent\/?/, "");
  const target = subPath ? `${RAILWAY_BASE}/${subPath}` : `${RAILWAY_BASE}/health`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    return await fetch(target, init);
  } catch (err) {
    return Response.json(
      {
        detail:
          err instanceof Error ? err.message : "Não foi possível contactar o agente no Railway.",
      },
      { status: 502 }
    );
  }
}
