"""
Agente Cineminha — servidor local Python (yt-dlp).
Execute na raiz do projeto: python server/main.py
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

from youtube_agent import extract_channel, extract_video, search_videos

app = FastAPI(title="Cineminha YouTube Agent", version="1.0.0")

_cors_raw = os.environ.get("CORS_ORIGINS", "*").strip()
_cors_origins = ["*"] if _cors_raw in ("", "*") else [o.strip() for o in _cors_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChannelRequest(BaseModel):
    url: str
    max_results: int = Field(default=30, ge=1, le=50)


class SearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=10, ge=1, le=20)


@app.get("/health")
def health():
    return {"ok": True, "agent": "yt-dlp", "message": "Agente YouTube ativo"}


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
