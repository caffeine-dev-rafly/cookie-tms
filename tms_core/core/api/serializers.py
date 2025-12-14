from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Custom claims
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['is_superuser'] = self.user.is_superuser
        data['is_staff'] = self.user.is_staff
        data['organization_id'] = self.user.organization.id if self.user.organization else None
        
        # Role Logic
        if self.user.is_superuser:
            data['role'] = "super_admin"
        elif self.user.is_staff and self.user.groups.filter(name="Client Manager").exists():
            data['role'] = "owner"
        elif self.user.is_staff:
            data['role'] = "staff"
        else:
            data['role'] = "driver"

        return data
