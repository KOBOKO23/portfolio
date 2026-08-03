"""Newsletter email dispatch helpers.

Bulk newsletter sends always go through AWS SES explicitly, via a dedicated
connection — independent of settings.EMAIL_BACKEND, which stays on SMTP for
transactional mail (contact form, admin notifications). SPF/DKIM/DMARC are
only configured for the newsletter's sending domain (koboko.co.ke), so
transactional mail is deliberately left untouched.
"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.urls import reverse

from .models import NewsletterIssue, NewsletterSubscriber

logger = logging.getLogger(__name__)


def _unsubscribe_url(subscriber: NewsletterSubscriber) -> str:
    path = reverse('newsletter-unsubscribe', args=[subscriber.unsubscribe_token])
    return f'{settings.BACKEND_URL}{path}'


def send_newsletter_issue(issue: NewsletterIssue) -> tuple[int, int]:
    """
    Send a newsletter issue to all active subscribers via SES.
    Returns (sent_count, failed_count).
    """
    subscribers = NewsletterSubscriber.objects.filter(is_active=True)
    sent = 0
    failed = 0

    subject = f'📬 Issue #{issue.number}: {issue.title}'
    from_email = settings.NEWSLETTER_FROM_EMAIL
    connection = get_connection(backend='django_ses.SESBackend')

    for subscriber in subscribers:
        unsubscribe_url = _unsubscribe_url(subscriber)
        text_body = _build_text_body(issue, unsubscribe_url)
        html_body = _build_html_body(issue, unsubscribe_url)
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=from_email,
                to=[subscriber.email],
                connection=connection,
                headers={
                    # RFC 2369 + RFC 8058 one-click unsubscribe.
                    'List-Unsubscribe': f'<{unsubscribe_url}>',
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
            )
            msg.attach_alternative(html_body, 'text/html')
            msg.send()
            sent += 1
        except Exception as exc:
            logger.error('Failed to email %s: %s', subscriber.email, exc)
            failed += 1

    return sent, failed


def _build_text_body(issue: NewsletterIssue, unsubscribe_url: str) -> str:
    topics = ', '.join(issue.topics_list) if issue.topics_list else ''
    return f"""
Issue #{issue.number} — {issue.title}
{'Topics: ' + topics if topics else ''}
Published: {issue.published_date}

{issue.excerpt}

{issue.content}

—
Koboko Newsletter · koboko.co.ke
Unsubscribe: {unsubscribe_url}
""".strip()


def _build_html_body(issue: NewsletterIssue, unsubscribe_url: str) -> str:
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
            <p style="color:#666;font-size:12px;margin:0 0 8px;">
              Koboko Newsletter · <a href="https://koboko.co.ke" style="color:#d4a574;">koboko.co.ke</a>
            </p>
            <p style="color:#666;font-size:12px;margin:0;">
              <a href="{unsubscribe_url}" style="color:#999;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
""".strip()
