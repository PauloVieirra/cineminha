export type ChannelUrlRef =
  | { kind: "id"; channelId: string }
  | { kind: "handle"; handle: string }
  | { kind: "legacy"; name: string };

function isYoutubeHost(host: string): boolean {
  const h = host.replace(/^www\./, "");
  return h === "youtube.com" || h.endsWith(".youtube.com") || h === "youtu.be";
}

/** URL de vídeo avulso (não canal). */
export function isYouTubeWatchUrl(raw: string): boolean {
  const input = raw.trim();
  if (!input) return false;
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w-]{6,}/i.test(
    input
  );
}

export function parseYouTubeChannelUrl(raw: string): ChannelUrlRef | null {
  const input = raw.trim();
  if (!input) return null;

  if (isYouTubeWatchUrl(input)) return null;

  let urlStr = input;
  if (!/^https?:\/\//i.test(input)) {
    urlStr = `https://www.youtube.com/${input.replace(/^\//, "")}`;
  }

  try {
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, "");
    if (!isYoutubeHost(host)) return null;

    let path = url.pathname.replace(/\/+$/, "") || "/";
    path = path.replace(
      /\/(videos|streams|shorts|featured|playlists|about|community|channels)(\/.*)?$/i,
      ""
    );

    const byId = /^\/channel\/(UC[\w-]{20,})/i.exec(path);
    if (byId) return { kind: "id", channelId: byId[1] };

    const byHandle = /^\/@([^/?#]+)/i.exec(path);
    if (byHandle) return { kind: "handle", handle: byHandle[1] };

    const byCustom = /^\/c\/([^/?#]+)/i.exec(path);
    if (byCustom) return { kind: "legacy", name: byCustom[1] };

    const byUser = /^\/user\/([^/?#]+)/i.exec(path);
    if (byUser) return { kind: "legacy", name: byUser[1] };

    return null;
  } catch {
    if (/^@[^/?#\s]+$/i.test(input)) return { kind: "handle", handle: input.slice(1) };
    if (/^UC[\w-]{20,}$/i.test(input)) return { kind: "id", channelId: input };
    if (isYouTubeWatchUrl(input)) return null;
    if (/^[\w.-]+$/i.test(input) && !input.includes(".")) {
      return { kind: "handle", handle: input };
    }
    return null;
  }
}

export function youtubeChannelPageUrl(youtubeChannelId: string): string {
  return `https://www.youtube.com/channel/${youtubeChannelId}`;
}
