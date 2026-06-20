"""
utils/renderers.py
──────────────────
Custom DRF renderer that enforces a consistent JSON envelope on every API
response so the frontend always receives the same shape regardless of status.

Success (2xx):
    {"success": true,  "data": <payload>, "error": null}

Failure (4xx / 5xx):
    {"success": false, "data": null,      "error": {"message": "...", "status": 4xx, "details": {...}}}

Registered as the sole DEFAULT_RENDERER_CLASSES in settings.REST_FRAMEWORK.
"""
from rest_framework.renderers import JSONRenderer


class StandardRenderer(JSONRenderer):
    """Wraps all responses in {success, data, error} envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is None:
            return super().render(data, accepted_media_type, renderer_context)

        response = renderer_context.get('response')
        status_code = response.status_code if response else 200

        if status_code >= 400:
            if isinstance(data, dict):
                msg = data.get('detail') or data.get('message')
                if not msg:
                    # DRF field-level validation errors — pull first readable message
                    for v in data.values():
                        if isinstance(v, list) and v and isinstance(v[0], str):
                            msg = v[0]
                            break
                if not msg:
                    msg = str(data)
            else:
                msg = str(data)
            wrapped = {
                'success': False,
                'data': None,
                'error': {
                    'message': msg,
                    'status': status_code,
                    'details': data if isinstance(data, dict) else {},
                },
            }
        else:
            wrapped = {
                'success': True,
                'data': data,
                'error': None,
            }

        return super().render(wrapped, accepted_media_type, renderer_context)
