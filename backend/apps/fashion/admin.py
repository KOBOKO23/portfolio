import os

from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import AdminDateWidget
from django.core.exceptions import PermissionDenied
from django.db.models import Max
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html

from .models import FashionCategory, FashionImage

MAX_BULK_FILES = 25


@admin.register(FashionCategory)
class FashionCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "image_count"]
    prepopulated_fields = {"slug": ("name",)}


class MultipleImageInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleImageField(forms.ImageField):
    """An ImageField that accepts several files and validates each one."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault(
            "widget",
            MultipleImageInput(
                attrs={"accept": "image/jpeg,image/png,image/webp", "class": "form-control"}
            ),
        )
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        files = data if isinstance(data, (list, tuple)) else [data]
        return [super(MultipleImageField, self).clean(f, initial) for f in files]


class BulkUploadForm(forms.Form):
    category = forms.ModelChoiceField(
        queryset=FashionCategory.objects.all(),
        required=False,
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    images = MultipleImageField(
        help_text=f"Up to {MAX_BULK_FILES} JPEG, PNG or WebP photos. "
        "They are resized to 2000 px and stripped of location data automatically."
    )
    location = forms.CharField(
        max_length=200, required=False, widget=forms.TextInput(attrs={"class": "form-control"})
    )
    photographer = forms.CharField(
        max_length=200, required=False, widget=forms.TextInput(attrs={"class": "form-control"})
    )
    date_taken = forms.DateField(required=False, widget=AdminDateWidget)

    def clean_images(self):
        images = self.cleaned_data["images"]
        if len(images) > MAX_BULK_FILES:
            raise forms.ValidationError(
                f"Upload at most {MAX_BULK_FILES} photos at a time ({len(images)} selected)."
            )
        return images


def title_from_filename(name: str) -> str:
    stem = os.path.splitext(os.path.basename(name))[0]
    return stem.replace("_", " ").replace("-", " ").strip().title()[:200] or "Untitled"


@admin.register(FashionImage)
class FashionImageAdmin(admin.ModelAdmin):
    list_display = [
        "preview",
        "title",
        "description",
        "category",
        "featured",
        "location",
        "order",
    ]
    list_display_links = ["preview"]
    list_filter = ["category", "featured"]
    # Titles and captions are editable right in the list, so a fresh batch from
    # the bulk upload can be captioned in one pass and saved with one click.
    list_editable = ["title", "description", "featured", "order"]
    search_fields = ["title", "description", "location"]
    readonly_fields = ["preview_large"]
    change_list_template = "admin/fashion/fashionimage/change_list.html"
    fieldsets = (
        (None, {"fields": ("image", "preview_large", "title", "description")}),
        ("Credits", {"fields": ("category", "photographer", "location", "date_taken")}),
        ("Placement", {"fields": ("featured", "order")}),
    )

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        field = super().formfield_for_dbfield(db_field, request, **kwargs)
        # Compact caption box in the list view; the full form keeps a big one.
        if db_field.name == "description" and request.resolver_match.url_name.endswith(
            "changelist"
        ):
            field.widget = forms.Textarea(attrs={"rows": 3, "cols": 48})
        return field

    @admin.display(description="")
    def preview(self, obj):
        thumb = obj.thumbnail or obj.image
        if not thumb:
            return ""
        return format_html(
            '<img src="{}" style="height:72px;width:56px;object-fit:cover;border-radius:3px">',
            thumb.url,
        )

    @admin.display(description="Current image")
    def preview_large(self, obj):
        if not obj.image:
            return "—"
        return format_html('<img src="{}" style="max-height:320px;max-width:100%">', obj.image.url)

    def add_view(self, request, form_url="", extra_context=None):
        extra_context = {
            **(extra_context or {}),
            "bulk_upload_url": reverse("admin:fashion_fashionimage_bulk_upload"),
        }
        return super().add_view(request, form_url, extra_context)

    def get_urls(self):
        urls = [
            path(
                "bulk-upload/",
                self.admin_site.admin_view(self.bulk_upload_view),
                name="fashion_fashionimage_bulk_upload",
            )
        ]
        return urls + super().get_urls()

    def bulk_upload_view(self, request):
        if not self.has_add_permission(request):
            raise PermissionDenied
        form = BulkUploadForm(request.POST or None, request.FILES or None)
        if request.method == "POST" and form.is_valid():
            data = form.cleaned_data
            next_order = (FashionImage.objects.aggregate(m=Max("order"))["m"] or 0) + 1
            created = []
            for offset, upload in enumerate(data["images"]):
                created.append(
                    FashionImage.objects.create(
                        title=title_from_filename(upload.name),
                        image=upload,
                        category=data["category"],
                        location=data["location"],
                        photographer=data["photographer"],
                        date_taken=data["date_taken"],
                        order=next_order + offset,
                    )
                )
            self.message_user(
                request,
                f"Uploaded {len(created)} photo(s). Add a title and description to each below, "
                "then press Save at the bottom.",
            )
            # Show just this batch so it can be captioned in one pass.
            ids = ",".join(str(img.pk) for img in created)
            return redirect(f"{reverse('admin:fashion_fashionimage_changelist')}?id__in={ids}")

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Bulk upload fashion photos",
            "form": form,
            "media": self.media + form.media,
            "max_files": MAX_BULK_FILES,
        }
        return TemplateResponse(request, "admin/fashion/fashionimage/bulk_upload.html", context)
