"""
apps/blog/notifications.py — Emails around blog comments.

- notify_owner_new_comment: tells the site owner (ADMIN_EMAIL) a comment is
  waiting for approval, with a direct link to approve/reply in the admin.
- notify_commenter_of_reply: tells a reader the author replied to them.

Both are best-effort: a mail failure is logged and never breaks the request.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _article_url(article, comment_id=None):
    url = f"{settings.SITE_URL}/blog/{article.slug}"
    return f"{url}#comment-{comment_id}" if comment_id else url


def _send(subject, body, to):
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=False)
    except Exception:
        logger.exception("Blog comment email to %s failed", to)


def notify_owner_new_comment(comment):
    to = getattr(settings, "ADMIN_EMAIL", "")
    if not to or comment.is_author:
        return
    kind = "reply" if comment.parent_id else "comment"
    admin_link = f"{settings.BACKEND_URL}/{settings.ADMIN_URL}blog/blogcomment/{comment.pk}/change/"
    lines = [
        f'New {kind} on "{comment.article.title}" from {comment.author_name} '
        f"<{comment.author_email}>:",
        "",
        comment.content,
        "",
    ]
    if comment.parent_id:
        lines += [f"In reply to {comment.parent.author_name}:", comment.parent.content, ""]
    lines += [
        "It stays hidden until you approve it. Approve or reply here:",
        admin_link,
    ]
    _send(f'New {kind} on "{comment.article.title}"', "\n".join(lines), to)


def notify_commenter_of_reply(reply):
    parent = reply.parent
    if not parent or not parent.author_email or parent.author_email == reply.author_email:
        return
    body = "\n".join(
        [
            f"Hi {parent.author_name},",
            "",
            f'{reply.author_name} replied to your comment on "{reply.article.title}":',
            "",
            reply.content,
            "",
            "Read the conversation:",
            _article_url(reply.article, parent.pk),
            "",
            "— Koboko",
        ]
    )
    _send(
        f'{reply.author_name} replied to your comment on "{reply.article.title}"',
        body,
        parent.author_email,
    )
