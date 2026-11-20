"""
utils/images.py — Shrink uploaded photos before they are stored.

Phone and camera photos are often 4000+ px and 5-12 MB; served as-is they make
galleries slow, and their EXIF data can carry the GPS position where they were
taken. Uploads are re-encoded with the camera orientation applied, capped in
size, and without EXIF: JPEG for photos, PNG when the image has transparency.
"""

import io
import os

from django.core.files.base import ContentFile
from PIL import Image, ImageOps


def shrink_image(upload, max_px: int = 2000, quality: int = 82) -> ContentFile:
    """Return a re-encoded copy of ``upload`` no larger than ``max_px`` on its longest side."""
    upload.seek(0)
    img = ImageOps.exif_transpose(Image.open(upload))
    img.thumbnail((max_px, max_px), Image.Resampling.LANCZOS)  # never upscales

    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    buf = io.BytesIO()
    if has_alpha:
        img.save(buf, "PNG", optimize=True)
        ext = ".png"
    else:
        img.convert("RGB").save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
        ext = ".jpg"

    base = os.path.splitext(os.path.basename(upload.name or ""))[0][:80] or "image"
    return ContentFile(buf.getvalue(), name=f"{base}{ext}")


def make_share_image(upload, size=(1200, 630), quality=80) -> ContentFile:
    """Return a 1200x630 JPEG crop of ``upload`` for social link previews (Open Graph size)."""
    upload.seek(0)
    img = ImageOps.exif_transpose(Image.open(upload))
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (10, 10, 10))
        bg.paste(img, mask=img.getchannel("A"))
        img = bg
    img = ImageOps.fit(img.convert("RGB"), size, Image.Resampling.LANCZOS, centering=(0.5, 0.4))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    base = os.path.splitext(os.path.basename(getattr(upload, "name", "") or ""))[0][:80] or "share"
    return ContentFile(buf.getvalue(), name=f"{base}-share.jpg")


def is_new_upload(field_file) -> bool:
    """True when an ImageField holds a file chosen in this request, not one already stored."""
    return bool(field_file) and not getattr(field_file, "_committed", True)
