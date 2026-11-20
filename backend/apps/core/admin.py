from django.contrib import admin
from django.utils.html import format_html

from .models import CareerEvent, Profile, Skill


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["full_name", "tagline", "years_experience", "projects_completed"]
    readonly_fields = ["hero_preview"]
    fieldsets = (
        (
            "Home page cover",
            {"fields": ("hero_image", "hero_preview", "hero_image_alt")},
        ),
        (
            "About you",
            {"fields": ("full_name", "tagline", "bio", "profile_image", "resume_pdf", "location")},
        ),
        (
            "Contact & social",
            {
                "fields": (
                    "email",
                    "phone",
                    "linkedin_url",
                    "github_url",
                    "twitter_url",
                    "instagram_url",
                )
            },
        ),
        ("Numbers", {"fields": ("years_experience", "projects_completed")}),
    )

    @admin.display(description="Current cover")
    def hero_preview(self, obj):
        if not obj.hero_image:
            return "No cover photo yet."
        return format_html(
            '<img src="{}" style="max-height:280px;max-width:100%;border-radius:4px">',
            obj.hero_image.url,
        )


@admin.register(CareerEvent)
class CareerEventAdmin(admin.ModelAdmin):
    list_display = ["title", "organization", "year", "is_current", "order"]
    list_editable = ["is_current", "order"]
    ordering = ["order"]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "proficiency", "order"]
    list_filter = ["category"]
    list_editable = ["proficiency", "order"]
    ordering = ["category", "order"]
