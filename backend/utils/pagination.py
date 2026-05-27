"""
utils/pagination.py
───────────────────
Project-wide DRF pagination class.

Query params:
    ?page=<n>           — page number (1-based)
    ?page_size=<n>      — items per page (max 100, default 20)

Response shape (sits inside the StandardRenderer data envelope):
    {
      "count":    <total items>,
      "next":     "<url | null>",
      "previous": "<url | null>",
      "results":  [...]
    }
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })
