from django.contrib import admin

from .models import CareerEvent, Profile, Skill


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'tagline', 'years_experience', 'projects_completed']


@admin.register(CareerEvent)
class CareerEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'organization', 'year', 'is_current', 'order']
    list_editable = ['is_current', 'order']
    ordering = ['order']


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'proficiency', 'order']
    list_filter = ['category']
    list_editable = ['proficiency', 'order']
    ordering = ['category', 'order']
