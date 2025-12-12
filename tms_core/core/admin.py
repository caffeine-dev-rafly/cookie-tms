from django.contrib import admin
from .models import Organization, User, Vehicle, Trip

# 1. Organization Admin
@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    # Add a custom method to show plan (since we removed the field in previous step, 
    # let's just show name for now or add 'settings' if you want)
    # If you get an error about subscription_plan, remove it from list_display

# 2. User Admin
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'organization', 'is_staff')
    list_filter = ('role', 'organization')

# 3. Vehicle Admin
@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('license_plate', 'vehicle_type', 'organization', 'gps_device_id')
    list_filter = ('organization',)

# 4. Trip Admin (The Money)
@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'driver', 'origin', 'destination', 'status', 'balance_view')
    list_filter = ('status', 'organization')
    
    # Show the calculated balance in the list
    def balance_view(self, obj):
        return f"Rp {obj.balance:,.0f}"
    balance_view.short_description = "Sisa Uang Jalan"