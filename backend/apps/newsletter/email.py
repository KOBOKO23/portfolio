"""Newsletter email dispatch helpers."""
import logging
from django.core.mail import send_mass_mail, EmailMultiAlternatives
from django.conf import settings
from .models import NewsletterSubscriber, NewsletterIssue

logger = logging.getLogger(__name__)


def send_newsletter_issue(issue: NewsletterIssue) -> tuple[int, int]:
    """
    Send a newsletter issue to all active subscribers.
    Returns (sent_count, failed_count).
    """
    subscribers = NewsletterSubscriber.objects.filter(is_active=True)
    sent = 0
    failed = 0

    subject = f'📬 Issue #{issue.number}: {issue.title}'
    text_body = _build_text_body(issue)
    html_body = _build_html_body(issue)

    from_email = settings.DEFAULT_FROM_EMAIL

    for subscriber in subscribers:
        unsubscribe_note = (
            f'\n\nYou are receiving this because you subscribed with {subscriber.email}.\n'
            'Reply UNSUBSCRIBE to stop receiving emails.'
        )
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body + unsubscribe_note,
                from_email=from_email,
                to=[subscriber.email],
            )
            msg.attach_alternative(html_body, 'text/html')
            msg.send()
            sent += 1
        except Exception as exc:
            logger.error('Failed to email %s: %s', subscriber.email, exc)
            failed += 1

    return sent, failed


def _build_text_body(issue: NewsletterIssue) -> str:
    topics = ', '.join(issue.topics_list) if issue.topics_list else ''
    return f"""
Issue #{issue.number} — {issue.title}
{'Topics: ' + topics if topics else ''}
Published: {issue.published_date}

{issue.excerpt}

{issue.content}

—
Koboko Newsletter · koboko.dev
""".strip()


def _build_html_body(issue: NewsletterIssue) -> str:
    topics_html = ''
    if issue.topics_list:
        pills = ''.join(
            f'<span style="display:inline-block;padding:4px 12px;margin:0 4px 4px 0;'
            f'background:#f5f5f0;border:1px solid #e0e0d8;font-size:12px;">{t}</span>'
            for t in issue.topics_list
        )
        topics_html = f'<p style="margin:16px 0;">{pills}</p>'

    content_html = issue.content.replace('\n', '<br>') if issue.content else ''

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;">
            <p style="color:#d4a574;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">
              Issue #{issue.number} · {issue.published_date}
            </p>
            <h1 style="color:#ffffff;font-size:28px;margin:0;line-height:1.3;">{issue.title}</h1>
          </td>
        </tr>
        <!-- Topics -->
        <tr><td style="padding:24px 40px 0;">{topics_html}</td></tr>
        <!-- Excerpt -->
        <tr>
          <td style="padding:24px 40px;border-left:3px solid #d4a574;margin:0 40px;">
            <p style="font-size:18px;color:#333;line-height:1.7;margin:0;font-style:italic;">
              {issue.excerpt}
            </p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:24px 40px 40px;color:#555;font-size:15px;line-height:1.8;">
            {content_html}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0a0a0a;padding:24px 40px;text-align:center;">
            <p style="color:#666;font-size:12px;margin:0;">
              Koboko Newsletter · <a href="https://koboko.dev" style="color:#d4a574;">koboko.dev</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
""".strip()
