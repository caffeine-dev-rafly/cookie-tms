from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def build_user_payload(cls, user):
        data = {
            'id': user.id,
            'username': user.username,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'organization_id': user.organization.id if user.organization else None,
        }

        # Role Logic
        if user.is_superuser:
            data['role'] = "super_admin"
        elif user.role == 'OWNER' or user.groups.filter(name="Client Manager").exists():
            data['role'] = "owner"
        elif user.role == 'FINANCE':
            data['role'] = "finance"
        elif user.is_staff:
            data['role'] = "staff"
        else:
            data['role'] = "driver"

        organization_status = 'active'
        disabled_reason = None
        days_remaining = None
        organization = user.organization

        if organization:
            days_remaining = organization.get_days_remaining()

            if not organization.is_active:
                organization_status = 'suspended'
                disabled_reason = 'Account suspended by administrator.'
            elif organization.subscription_end_date and days_remaining is not None and days_remaining < 0:
                organization_status = 'expired'
                disabled_reason = 'Subscription expired. Contact support.'
            elif days_remaining is not None and days_remaining <= 3:
                organization_status = 'expiring'

            if days_remaining is not None and 0 <= days_remaining <= 3:
                data['warning'] = f"Your subscription expires in {days_remaining} days"

        data['organization_status'] = organization_status
        data['organization_days_remaining'] = days_remaining
        data['stop_alert_minutes'] = user.stop_alert_minutes
        data['offline_alert_minutes'] = user.offline_alert_minutes
        if disabled_reason:
            data['disabled_reason'] = disabled_reason

        return data

    def validate(self, attrs):
        data = super().validate(attrs)

        payload = self.build_user_payload(self.user)

        if not self.user.is_superuser:
            if payload.get('organization_status') == 'suspended':
                raise AuthenticationFailed("Account Suspended. Contact Support.")
            if payload.get('organization_status') == 'expired':
                raise AuthenticationFailed("Subscription Expired. Contact Support.")

        data.update(payload)
        return data
