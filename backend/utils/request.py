"""
utils/request.py — Trustworthy client IP behind the nginx reverse proxy.

The browser controls the X-Forwarded-For header, so its *first* entry can be
anything an attacker types: trusting it lets them dodge rate limits, forge the
IP stored with comments/likes, or pass an IP allowlist. nginx sets X-Real-IP to
the address of the TCP connection it actually received ($remote_addr),
overwriting any value the client sent, so that is what we use. Without nginx
(local development) we fall back to REMOTE_ADDR.
"""


def client_ip(request) -> str:
    meta = getattr(request, "META", {})
    return (meta.get("HTTP_X_REAL_IP") or meta.get("REMOTE_ADDR") or "").strip()
