FROM python:3.12-slim

# ffmpeg is required by faster-whisper to decode webm/opus audio from the browser
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (layer cache friendly)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Hugging Face Spaces requires port 7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
