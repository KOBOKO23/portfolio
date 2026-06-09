from django.contrib import admin

from .models import GreatMenProgram, ImpactGoal, VolunteerApplication


@admin.register(GreatMenProgram)
class GreatMenProgramAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'location', 'spots', 'is_active', 'order']
    list_filter = ['is_active']
    list_editable = ['is_active', 'order']


@admin.register(ImpactGoal)
class ImpactGoalAdmin(admin.ModelAdmin):
    list_display = ['label', 'number', 'progress', 'order']
    list_editable = ['progress', 'order']


@admin.register(VolunteerApplication)
class VolunteerApplicationAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'profession', 'created_at', 'is_reviewed']
    list_filter = ['is_reviewed']
    list_editable = ['is_reviewed']
    readonly_fields = ['created_at']
    search_fields = ['full_name', 'email', 'profession']
