import secrets

from django.db import migrations, models


def backfill_unsubscribe_tokens(apps, schema_editor):
    NewsletterSubscriber = apps.get_model('newsletter', 'NewsletterSubscriber')
    for subscriber in NewsletterSubscriber.objects.filter(unsubscribe_token=''):
        subscriber.unsubscribe_token = secrets.token_urlsafe(32)
        subscriber.save(update_fields=['unsubscribe_token'])


class Migration(migrations.Migration):

    dependencies = [
        ("newsletter", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="newslettersubscriber",
            name="unsubscribe_token",
            field=models.CharField(blank=True, default="", max_length=64),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_unsubscribe_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="newslettersubscriber",
            name="unsubscribe_token",
            field=models.CharField(blank=True, max_length=64, unique=True),
        ),
    ]
