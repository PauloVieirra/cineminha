"""
Agente Cineminha — servidor Python (yt-dlp).
Local: python server/main.py  |  Produção: Railway (porta $PORT)
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.requests import Request
from starlette.responses import Response

from youtube_agent import extract_channel, extract_video, search_videos

# Origens que sempre podem chamar o agente (Vercel + dev local)
DEFAULT_CORS_ORIGINS = [
    "https://cineminha-teal.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def build_cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if raw == "*":
        return ["*"]
    origins: list[str] = []
    if raw:
        origins.extend(part.strip() for part in raw.split(",") if part.strip())
    for origin in DEFAULT_CORS_ORIGINS:
        if origin not in origins:
            origins.append(origin)
    return origins if origins else ["*"]


CORS_ORIGINS = build_cors_origins()
CORS_WILDCARD = CORS_ORIGINS == ["*"]

app = FastAPI(title="Cineminha YouTube Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def _cors_allow_origin(request: Request) -> str | None:
    origin = request.headers.get("origin")
    if not origin:
        return None
    if CORS_WILDCARD:
        return "*"
    if origin in CORS_ORIGINS:
        return origin
    return None


@app.middleware("http")
async def cors_preflight_and_headers(request: Request, call_next):
    """Garante CORS mesmo se o proxy do Railway alterar respostas do middleware padrão."""
    allow_origin = _cors_allow_origin(request)

    if request.method == "OPTIONS" and allow_origin:
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": allow_origin,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400",
            },
        )

    response = await call_next(request)
    if allow_origin:
        response.headers["Access-Control-Allow-Origin"] = allow_origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


class ChannelRequest(BaseModel):
    url: str
    max_results: int = Field(default=30, ge=1, le=50)


class SearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=10, ge=1, le=20)


@app.get("/health")
def health():
    return {
        "ok": True,
        "agent": "yt-dlp",
        "message": "Agente YouTube ativo",
        "cors": CORS_ORIGINS if len(CORS_ORIGINS) <= 5 else ["... configurado"],
    }


@app.post("/youtube/channel")
def youtube_channel(req: ChannelRequest):
    try:
        return extract_channel(req.url, req.max_results)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao ler canal: {e}") from e


@app.get("/youtube/video/{video_id}")
def youtube_video(video_id: str):
    try:
        return extract_video(video_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao ler vídeo: {e}") from e


@app.post("/youtube/search")
def youtube_search(req: SearchRequest):
    try:
        return {"items": search_videos(req.query, req.max_results)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro na busca: {e}") from e


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8765"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
