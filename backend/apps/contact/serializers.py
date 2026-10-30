"""
apps/contact/serializers.py — Contact form message serialization.
"""

import re

from rest_framework import serializers

from .models import ContactMessage

# Digits with optional leading +, spaces, dashes or brackets; 9-15 digits total.
_PHONE_CHARS = re.compile(r"^\+?[\d\s\-()]+$")


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_phone(self, value):
        value = value.strip()
        if not value:
            return value
        digits = re.sub(r"\D", "", value)
        if not _PHONE_CHARS.match(value) or not 9 <= len(digits) <= 15:
            raise serializers.ValidationError("Enter a valid phone number, e.g. +254 7XX XXX XXX.")
        return value

    def validate(self, attrs):
        if attrs.get("subject") == "callback" and not attrs.get("phone"):
            raise serializers.ValidationError(
                {"phone": "Add the number you'd like to be called on."}
            )
        return attrs
