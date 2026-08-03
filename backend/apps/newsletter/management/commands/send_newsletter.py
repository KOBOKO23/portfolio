"""Send a NewsletterIssue to all active subscribers via SES.

Usage: python manage.py send_newsletter <issue_number>
"""
from django.core.management.base import BaseCommand, CommandError

from apps.newsletter.email import send_newsletter_issue
from apps.newsletter.models import NewsletterIssue


class Command(BaseCommand):
    help = 'Send a newsletter issue to all active subscribers via AWS SES.'

    def add_arguments(self, parser):
        parser.add_argument('issue_number', type=int, help='NewsletterIssue.number to send')

    def handle(self, *args, **options):
        try:
            issue = NewsletterIssue.objects.get(number=options['issue_number'])
        except NewsletterIssue.DoesNotExist as exc:
            raise CommandError(f'No NewsletterIssue with number={options["issue_number"]}') from exc

        sent, failed = send_newsletter_issue(issue)
        style = self.style.SUCCESS if failed == 0 else self.style.WARNING
        self.stdout.write(style(f'Issue #{issue.number} sent: {sent} delivered, {failed} failed.'))
