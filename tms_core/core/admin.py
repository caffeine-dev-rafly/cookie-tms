from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Organization, Vehicle, Customer, Route, Origin, Trip

# Get the custom user model (core_user)
User = get_user_model()

# ==========================================
# 1. THE SECURITY MIXIN (The "Blindfold")
# ==========================================
class SaaSAdminMixin:
    """
    Mixin to restrict data visibility to the user's Organization.
    """
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Superuser (God Mode) sees everything
        if request.user.is_superuser:
            return qs
        # Clients only see their own data
        # (This assumes the user has .organization and the model has .organization)
        return qs.filter(organization=request.user.organization)

    def save_model(self, request, obj, form, change):
        # Automatically link new data to the creator's organization
        if not request.user.is_superuser:
            obj.organization = request.user.organization
        super().save_model(request, obj, form, change)

    def get_form(self, request, obj=None, **kwargs):
        # Hide the 'Organization' dropdown from the form for Clients
        form = super().get_form(request, obj, **kwargs)
        if not request.user.is_superuser:
            # If the model has an 'organization' field, hide it
            if 'organization' in form.base_fields:
                form.base_fields['organization'].disabled = True
                form.base_fields['organization'].widget.attrs['style'] = 'display:none;'
                form.base_fields['organization'].label = ''
        return form

# ==========================================
# 2. APPLY SECURITY TO BUSINESS MODELS
# ==========================================

class SaaSAdmin(SaaSAdminMixin, admin.ModelAdmin):
    pass

@admin.register(Vehicle)
class VehicleAdmin(SaaSAdmin):
    list_display = ('license_plate', 'vehicle_type', 'gps_device_id')
    search_fields = ('license_plate',)

@admin.register(Customer)
class CustomerAdmin(SaaSAdmin):
    list_display = ('name', 'phone')

@admin.register(Route)
class RouteAdmin(SaaSAdmin):
    list_display = ('origin', 'destination', 'standard_distance_km')

@admin.register(Origin)
class OriginAdmin(SaaSAdmin):
    list_display = ('name', 'address', 'latitude', 'longitude', 'radius', 'traccar_id', 'is_origin')

@admin.register(Trip)
class TripAdmin(SaaSAdmin):
    list_display = ('vehicle', 'driver_name', 'status')
    
    def driver_name(self, obj):
        # Handle cases where driver might be null
        return obj.driver.username if obj.driver else "-"

# ==========================================
# 3. SECURE THE USER LIST (Employee Management)
# ==========================================
@admin.register(User)
class SaasUserAdmin(SaaSAdminMixin, BaseUserAdmin):
    """
    Allows Clients to manage their own Employees (Users),
    but filters the list so they don't see users from other companies.
    """
    list_display = ('username', 'email', 'is_staff', 'organization')
    
    # We need to explicitly define fieldsets because we are inheriting from UserAdmin
    # and we want to ensure 'organization' is handled correctly.
    fieldsets = BaseUserAdmin.fieldsets + (
        ('SaaS Info', {'fields': ('organization',)}),
    )

# ==========================================
# 4. HIDE THE ORGANIZATION MODEL
# ==========================================
@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'created_at')

    def has_module_permission(self, request):
        # HIDE from Sidebar unless Superuser
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False
