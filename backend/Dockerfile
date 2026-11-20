FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# collectstatic only gathers files; it needs settings to load but no real
# secrets. DEBUG is off by default, which rejects the dev key, so give the
# build a throwaway one.
RUN SECRET_KEY=build-only-collectstatic-not-a-secret python manage.py collectstatic --noinput

# Run as an unprivileged user, not root: if the app were ever compromised the
# attacker would not own the container. Uploads go to S3; the only local writes
# are the rate-limit cache and temp files.
RUN useradd --system --uid 10001 --create-home app \
    && mkdir -p /app/.cache \
    && chown app /app/.cache
ENV CACHE_DIR=/app/.cache
USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
