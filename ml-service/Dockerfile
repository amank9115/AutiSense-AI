# ──────────────────────────────────────────────────────────────────────────────
# AutiSense-AI ML Service (FastAPI) — Production Image
#
# Model strategy: Option C — the RandomForest model is TRAINED AT BUILD TIME by
# running train_model.py, which fetches the public UCI ASD dataset and writes the
# .pkl artifacts into the image (the *.pkl files are gitignored, so they cannot be
# copied from the build context). This requires network access during `docker build`.
# Alternatives for the future: Git LFS for the .pkl files, or download from S3 on start.
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8001

# System libraries required by OpenCV / MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1-mesa-glx \
      libglib2.0-0 \
      libsm6 \
      libxext6 \
      libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and training assets
COPY . .

# Train the model at build time so the .pkl artifacts exist in the image
RUN python train_model.py

# Run as a non-root user
RUN useradd --create-home --uid 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,os,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+os.getenv('PORT','8001')+'/health').getcode()==200 else 1)" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
