import calendar
from datetime import date
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Organization, User
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class OrganizationRenewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        if not request.user.is_superuser:
            raise PermissionDenied("Only super admins can renew subscriptions.")

        organization = get_object_or_404(Organization, pk=id)
        months = request.data.get("months")

        try:
            months = int(months)
        except (TypeError, ValueError):
            return Response({"error": "months must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        if months <= 0:
            return Response({"error": "months must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        base_date = organization.subscription_end_date or today
        if base_date < today:
            base_date = today

        new_end_date = self._add_months(base_date, months)
        organization.subscription_end_date = new_end_date
        organization.is_active = True
        organization.save()

        return Response(
            {
                "id": organization.id,
                "subscription_end_date": organization.subscription_end_date,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _add_months(start_date: date, months: int) -> date:
        month = start_date.month - 1 + months
        year = start_date.year + month // 12
        month = month % 12 + 1
        day = min(start_date.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)


class OrganizationImpersonateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        if not request.user.is_superuser:
            raise PermissionDenied("Only super admins can impersonate users.")

        organization = get_object_or_404(Organization, pk=id)
        user_id = request.data.get("user_id")

        if user_id:
            target_user = get_object_or_404(User, pk=user_id, organization=organization)
        else:
            target_user = (
                User.objects.filter(organization=organization, is_superuser=False)
                .order_by("id")
                .first()
            )

        if not target_user:
            return Response(
                {"error": "No user found to impersonate in this organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(target_user)
        payload = CustomTokenObtainPairSerializer.build_user_payload(target_user)
        payload.update(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        )
        return Response(payload, status=status.HTTP_200_OK)
