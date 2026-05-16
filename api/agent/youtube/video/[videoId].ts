import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyRailway } from "../../../_lib/railway";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Use GET" });
  }

  const videoId = req.query.videoId;
  if (!videoId || Array.isArray(videoId)) {
    return res.status(400).json({ detail: "videoId obrigatório" });
  }

  try {
    const upstream = await proxyRailway(
      `youtube/video/${encodeURIComponent(videoId)}`,
      { method: "GET" }
    );
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.contentType);
    return res.send(upstream.body);
  } catch (err) {
    return res.status(502).json({
      detail: err instanceof Error ? err.message : "Agente Railway indisponível",
    });
  }
}
