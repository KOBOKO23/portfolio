from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import FashionCategory, FashionImage

# ── Helpers ───────────────────────────────────────────────────────────────────


def make_category(**kwargs) -> FashionCategory:
    defaults = {"name": "Street Style"}
    defaults.update(kwargs)
    return FashionCategory.objects.create(**defaults)


def make_image(category=None, **kwargs) -> FashionImage:
    defaults = {
        "title": "Nairobi Meets Tokyo",
        "description": "Urban fashion fusion",
        "location": "Nairobi CBD",
        "category": category,
        "order": 0,
    }
    defaults.update(kwargs)
    img = FashionImage(**defaults)
    img.image = "fashion/test.jpg"
    img.save()
    return img


# ── Model Tests ───────────────────────────────────────────────────────────────


class FashionCategoryModelTest(TestCase):
    def test_slug_auto_generated(self):
        cat = make_category(name="Street Style")
        self.assertEqual(cat.slug, "street-style")

    def test_slug_not_overwritten(self):
        cat = FashionCategory.objects.create(name="Casual", slug="custom-slug")
        self.assertEqual(cat.slug, "custom-slug")

    def test_str(self):
        cat = make_category(name="Formal")
        self.assertEqual(str(cat), "Formal")

    def test_image_count(self):
        cat = make_category()
        make_image(category=cat)
        make_image(category=cat, title="Second Look")
        self.assertEqual(cat.image_count, 2)

    def test_image_count_zero_when_no_images(self):
        cat = make_category()
        self.assertEqual(cat.image_count, 0)


class FashionImageModelTest(TestCase):
    def test_str(self):
        cat = make_category()
        img = make_image(category=cat, title="Vintage Vibes")
        self.assertEqual(str(img), "Vintage Vibes")

    def test_ordering_by_order_then_date(self):
        cat = make_category()
        make_image(category=cat, title="B", order=2)
        make_image(category=cat, title="A", order=1)
        first = FashionImage.objects.first()
        self.assertEqual(first.title, "A")


# ── API Tests ─────────────────────────────────────────────────────────────────


class FashionCategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_empty_list(self):
        res = self.client.get("/api/fashion/categories/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_categories_listed(self):
        make_category(name="Street Style")
        make_category(name="Formal")
        res = self.client.get("/api/fashion/categories/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_no_pagination(self):
        make_category()
        res = self.client.get("/api/fashion/categories/")
        self.assertIsInstance(res.data, list)


class FashionImageAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_category(name="Street Style")

    def test_empty_list(self):
        res = self.client.get("/api/fashion/images/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_images_listed(self):
        make_image(category=self.cat, title="Look 1")
        make_image(category=self.cat, title="Look 2")
        res = self.client.get("/api/fashion/images/")
        self.assertGreaterEqual(len(res.data["results"]), 2)

    def test_filter_by_category_slug(self):
        other_cat = make_category(name="Formal")
        make_image(category=self.cat, title="Street Look")
        make_image(category=other_cat, title="Suit Up")
        res = self.client.get("/api/fashion/images/?category__slug=street-style")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [i["title"] for i in res.data["results"]]
        self.assertIn("Street Look", titles)
        self.assertNotIn("Suit Up", titles)

    def test_search_by_title(self):
        make_image(category=self.cat, title="Tokyo Vibes")
        make_image(category=self.cat, title="Nairobi Nights")
        res = self.client.get("/api/fashion/images/?search=Tokyo")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [i["title"] for i in res.data["results"]]
        self.assertIn("Tokyo Vibes", titles)
        self.assertNotIn("Nairobi Nights", titles)


# ── Upload processing ─────────────────────────────────────────────────────────


def jpeg_upload(name="look.jpg", size=(4000, 3000), exif_gps=False):
    """An in-memory JPEG the size of a phone photo."""
    import io

    from django.core.files.uploadedfile import SimpleUploadedFile
    from PIL import Image

    img = Image.new("RGB", size, (180, 120, 90))
    buf = io.BytesIO()
    kwargs = {}
    if exif_gps:
        exif = Image.Exif()
        exif[0x8825] = {1: "S", 2: (1.0, 17.0, 31.0)}  # GPSInfo
        kwargs["exif"] = exif
    img.save(buf, "JPEG", quality=95, **kwargs)
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/jpeg")


class UploadProcessingTest(TestCase):
    def setUp(self):
        import shutil
        import tempfile

        from django.test import override_settings

        self.media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.media, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=self.media)
        override.enable()
        self.addCleanup(override.disable)

    def test_upload_is_resized_and_gets_a_thumbnail(self):
        from PIL import Image

        img = FashionImage.objects.create(title="Look", image=jpeg_upload())
        with Image.open(img.image.path) as full, Image.open(img.thumbnail.path) as thumb:
            self.assertEqual(max(full.size), 2000)
            self.assertEqual(max(thumb.size), 600)
            self.assertEqual(full.format, "JPEG")

    def test_location_data_is_stripped(self):
        from PIL import Image

        img = FashionImage.objects.create(title="Look", image=jpeg_upload(exif_gps=True))
        with Image.open(img.image.path) as full:
            self.assertNotIn(0x8825, full.getexif())

    def test_small_images_are_not_upscaled(self):
        from PIL import Image

        img = FashionImage.objects.create(title="Small", image=jpeg_upload(size=(800, 600)))
        with Image.open(img.image.path) as full:
            self.assertEqual(full.size, (800, 600))

    def test_resaving_does_not_reprocess(self):
        img = FashionImage.objects.create(title="Look", image=jpeg_upload())
        name = img.image.name
        img.title = "Renamed"
        img.save()
        img.refresh_from_db()
        self.assertEqual(img.image.name, name)

    def test_api_returns_thumbnail_url(self):
        FashionImage.objects.create(title="Look", image=jpeg_upload())
        res = APIClient().get("/api/fashion/images/")
        item = res.json()["data"]
        item = item[0] if isinstance(item, list) else item["results"][0]
        self.assertIn("fashion/thumbs/", item["thumbnail"])


class BulkUploadAdminTest(UploadProcessingTest):
    def setUp(self):
        super().setUp()
        from django.conf import settings
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.create_superuser("admin", "a@example.com", "pw-12345!")
        self.client.force_login(user)
        self.url = f"/{settings.ADMIN_URL}fashion/fashionimage/bulk-upload/"
        self.category = make_category(name="Editorial")

    def test_changelist_links_to_bulk_upload(self):
        from django.conf import settings

        res = self.client.get(f"/{settings.ADMIN_URL}fashion/fashionimage/")
        self.assertContains(res, "bulk-upload/")

    def test_bulk_upload_creates_one_entry_per_photo(self):
        make_image(order=4)
        res = self.client.post(
            self.url,
            {
                "category": self.category.pk,
                "images": [jpeg_upload("red_dress-01.jpg"), jpeg_upload("street-look.jpg")],
                "location": "Nairobi",
            },
        )
        self.assertEqual(res.status_code, 302)
        created = FashionImage.objects.filter(category=self.category).order_by("order")
        self.assertEqual([i.title for i in created], ["Red Dress 01", "Street Look"])
        self.assertEqual([i.order for i in created], [5, 6])
        self.assertTrue(all(i.thumbnail for i in created))
        self.assertTrue(all(i.location == "Nairobi" for i in created))

    def test_bulk_upload_rejects_too_many_files(self):
        from .admin import MAX_BULK_FILES

        files = [jpeg_upload(f"p{i}.jpg", size=(10, 10)) for i in range(MAX_BULK_FILES + 1)]
        res = self.client.post(self.url, {"category": self.category.pk, "images": files})
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, f"at most {MAX_BULK_FILES}")
        self.assertFalse(FashionImage.objects.exists())

    def test_non_images_are_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        bad = SimpleUploadedFile("notes.jpg", b"not an image", content_type="image/jpeg")
        res = self.client.post(self.url, {"category": self.category.pk, "images": [bad]})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(FashionImage.objects.exists())
