"""Extrai metadados do YouTube via yt-dlp — sem API oficial do Google."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

import yt_dlp

VIDEO_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{11}$")


def _thumb(video_id: str, thumb: Any = None) -> str:
    """Resolve URL de thumbnail (string, dict ou lista do yt-dlp)."""
    if isinstance(thumb, list) and thumb:
        thumb = thumb[-1]
    if isinstance(thumb, dict):
        thumb = thumb.get("url") or thumb.get("id")
    if isinstance(thumb, str) and thumb.startswith("http"):
        return thumb
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"


def _video_id_from_entry(entry: dict[str, Any]) -> str | None:
    vid = entry.get("id")
    if vid and VIDEO_ID_RE.match(str(vid)):
        return str(vid)
    url = entry.get("url") or entry.get("webpage_url") or ""
    if isinstance(url, str):
        m = re.search(
            r"(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})",
            url,
        )
        if m:
            return m.group(1)
    return None


def _normalize_channel_url(url: str) -> str:
    raw = url.strip()
    if not raw:
        raise ValueError("URL vazia")
    if not raw.startswith("http"):
        raw = f"https://www.youtube.com/{raw.lstrip('/')}"
    parsed = urlparse(raw)
    host = parsed.netloc.replace("www.", "")
    if "youtube.com" not in host and host != "youtu.be":
        raise ValueError("URL deve ser do YouTube")
    return raw.split("#")[0].split("?")[0].rstrip("/")


def _to_videos_tab_url(url: str) -> str:
    """Força a aba /videos do canal (onde yt-dlp lista uploads)."""
    base = _normalize_channel_url(url)
    if re.search(r"/watch(?:\?|$)", base, re.I):
        return base
    if re.search(r"/(videos|streams|shorts|live)(/|$)", base, re.I):
        if "/videos" in base.lower():
            return re.sub(r"/videos.*$", "/videos", base, flags=re.I)
        return re.sub(r"/(streams|shorts|live).*$", "/videos", base, flags=re.I)
    return f"{base}/videos"


def _entry_to_video(
    entry: dict[str, Any],
    channel_id: str,
    channel_title: str,
) -> dict[str, str] | None:
    vid = _video_id_from_entry(entry)
    if not vid:
        return None
    thumb_src = entry.get("thumbnail") or entry.get("thumbnails")
    return {
        "videoId": vid,
        "title": (entry.get("title") or "Sem título").strip(),
        "thumbnail": _thumb(vid, thumb_src),
        "channelId": channel_id or str(entry.get("channel_id") or ""),
        "channelTitle": channel_title or str(entry.get("channel") or entry.get("uploader") or ""),
    }


def _collect_videos_from_info(
    info: dict[str, Any],
    channel_id: str,
    channel_title: str,
    max_results: int,
) -> list[dict[str, str]]:
    entries = info.get("entries") or []
    if entries and not isinstance(entries, list):
        entries = list(entries)

    videos: list[dict[str, str]] = []
    for entry in entries:
        if not entry or len(videos) >= max_results:
            break
        mapped = _entry_to_video(entry, channel_id, channel_title)
        if mapped:
            videos.append(mapped)

    if not videos and info.get("_type") == "video":
        single = _entry_to_video(info, channel_id, channel_title)
        if single:
            videos.append(single)

    return videos


def _extract_playlist(url: str, max_results: int) -> dict[str, Any]:
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
        "playlistend": max_results,
        "ignoreerrors": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False) or {}


def _channel_attempt_urls(normalized: str, videos_url: str) -> list[str]:
    """URLs alternativas — @handle costuma falhar; /c/nome/videos costuma funcionar."""
    attempts: list[str] = []
    seen: set[str] = set()

    def add(u: str) -> None:
        u = u.rstrip("/")
        if u not in seen:
            seen.add(u)
            attempts.append(u)

    add(videos_url)
    add(normalized)
    handle_match = re.search(r"/@([^/?#]+)", normalized, re.I)
    if handle_match:
        handle = handle_match.group(1)
        add(f"https://www.youtube.com/c/{handle}/videos")
        add(f"https://www.youtube.com/c/{handle}")
    legacy_match = re.search(r"/c/([^/?#]+)", normalized, re.I)
    if legacy_match:
        name = legacy_match.group(1)
        add(f"https://www.youtube.com/c/{name}/videos")
    return attempts


def extract_channel(url: str, max_results: int = 30) -> dict[str, Any]:
    """Lista vídeos de um canal a partir da URL (@handle, /channel/UC..., etc.)."""
    normalized = _normalize_channel_url(url)
    max_results = max(1, min(max_results, 50))
    videos_url = _to_videos_tab_url(normalized)

    info: dict[str, Any] | None = None
    last_error: Exception | None = None

    for attempt_url in _channel_attempt_urls(normalized, videos_url):
        try:
            info = _extract_playlist(attempt_url, max_results)
            if info.get("entries"):
                break
        except Exception as e:
            last_error = e
            info = None

    if not info:
        msg = "Não foi possível ler este canal."
        if last_error:
            msg = f"{msg} ({last_error})"
        raise ValueError(msg)

    channel_id = str(info.get("channel_id") or info.get("id") or "")
    channel_title = str(
        info.get("channel") or info.get("uploader") or info.get("title") or "Canal"
    )
    description = str(info.get("description") or "")
    thumbnail = ""
    thumbs = info.get("thumbnails")
    if isinstance(thumbs, list) and thumbs:
        last = thumbs[-1]
        thumbnail = last.get("url") if isinstance(last, dict) else str(last)
    if not thumbnail and channel_id.startswith("UC"):
        thumbnail = f"https://yt3.googleusercontent.com/-placeholder=s800-c-k-c0x00ffffff-no-rj"

    videos = _collect_videos_from_info(info, channel_id, channel_title, max_results)

    if not videos and channel_id.startswith("UC"):
        try:
            fallback_url = f"https://www.youtube.com/channel/{channel_id}/videos"
            if fallback_url.rstrip("/") != videos_url.rstrip("/"):
                info2 = _extract_playlist(fallback_url, max_results)
                videos = _collect_videos_from_info(
                    info2, channel_id, channel_title, max_results
                )
                if not description:
                    description = str(info2.get("description") or "")
        except Exception:
            pass

    if not videos and not channel_id.startswith("UC"):
        try:
            meta_opts: dict[str, Any] = {
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "extract_flat": True,
                "playlist_items": "0",
            }
            with yt_dlp.YoutubeDL(meta_opts) as ydl:
                meta = ydl.extract_info(normalized, download=False) or {}
            resolved_id = str(meta.get("channel_id") or meta.get("id") or "")
            if resolved_id.startswith("UC"):
                channel_id = resolved_id
                channel_title = str(
                    meta.get("channel")
                    or meta.get("uploader")
                    or channel_title
                )
                info3 = _extract_playlist(
                    f"https://www.youtube.com/channel/{channel_id}/videos",
                    max_results,
                )
                videos = _collect_videos_from_info(
                    info3, channel_id, channel_title, max_results
                )
        except Exception:
            pass

    if not channel_id and videos:
        channel_id = videos[0].get("channelId", "")

    if not channel_id:
        raise ValueError("Canal não encontrado. Verifique o link.")

    return {
        "youtubeChannelId": channel_id,
        "title": channel_title,
        "description": description[:500] if description else "",
        "thumbnail": thumbnail,
        "videos": videos[:max_results],
    }


def extract_video(video_id: str) -> dict[str, str]:
    if not VIDEO_ID_RE.match(video_id):
        raise ValueError("ID de vídeo inválido")

    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    if not info:
        raise ValueError("Vídeo não encontrado")

    channel_id = str(info.get("channel_id") or "")
    channel_title = str(info.get("channel") or info.get("uploader") or "")

    return {
        "videoId": video_id,
        "title": str(info.get("title") or "Sem título"),
        "thumbnail": _thumb(video_id, info.get("thumbnail") or info.get("thumbnails")),
        "channelId": channel_id,
        "channelTitle": channel_title,
    }


def search_videos(query: str, max_results: int = 10) -> list[dict[str, str]]:
    q = query.strip()
    if len(q) < 2:
        return []

    max_results = max(1, min(max_results, 20))
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(f"ytsearch{max_results}:{q}", download=False)

    entries = (info or {}).get("entries") or []
    results: list[dict[str, str]] = []
    for entry in entries:
        if not entry:
            continue
        vid = _video_id_from_entry(entry)
        if not vid:
            continue
        results.append(
            {
                "videoId": vid,
                "title": str(entry.get("title") or "Sem título"),
                "thumbnail": _thumb(vid, entry.get("thumbnail") or entry.get("thumbnails")),
                "channelId": str(entry.get("channel_id") or ""),
                "channelTitle": str(entry.get("channel") or entry.get("uploader") or ""),
            }
        )
    return results
