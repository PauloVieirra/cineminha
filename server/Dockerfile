FROM python:3.12-slim

WORKDIR /app

# yt-dlp usa ffmpeg em alguns formatos / metadados
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py youtube_agent.py ./

ENV PORT=8765
EXPOSE 8765

# Railway injeta $PORT em runtime
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8765}"]
