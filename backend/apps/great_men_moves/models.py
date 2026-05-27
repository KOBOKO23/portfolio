from django.db import models


class GreatMenProgram(models.Model):
    title = models.CharField(max_length=300)
    date = models.DateField()
    location = models.CharField(max_length=300)
    description = models.TextField()
    spots = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='gmm/programs/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['date']
        verbose_name = 'Great Men Program'

    def __str__(self):
        return self.title


class ImpactGoal(models.Model):
    number = models.CharField(max_length=20, help_text='Display value e.g. "500+" or "12"')
    label = models.CharField(max_length=200)
    progress = models.PositiveSmallIntegerField(default=0, help_text='0-100 percentage')
    icon = models.CharField(max_length=50, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Impact Goal'

    def __str__(self):
        return self.label


class VolunteerApplication(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    profession = models.CharField(max_length=200, blank=True)
    motivation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_reviewed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Volunteer Application'

    def __str__(self):
        return f'{self.full_name} ({self.email})'
