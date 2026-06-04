"""
utils/media.py
--------------
Helper for building absolute media URLs that works with both local dev
(Django runserver serving /media/) and production S3 storage (where
field.url is already an absolute https:// URL).
"""


def media_url(request, field):
    """Return an absolute URL for a FileField/ImageField value.

    - With S3 storage: field.url is already https://bucket.s3.../path, returned as-is.
    - With local storage: field.url is /media/path, prefixed with the request host.
    - If request is None (management commands): returns field.url as-is.
    """
    if not field:
        return None
    try:
        url = field.url
    except ValueError:
        return None
    if not url:
        return None
    if url.startswith(('http://', 'https://')):
        return url
    if request:
        return request.build_absolute_uri(url)
    return url
