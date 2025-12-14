from django.contrib import admin
from .models import ClientVehicle, ClientOrganization

# Register your models here.
@admin.register(ClientVehicle)
class ClientVehicleAdmin(admin.ModelAdmin):
    list_display = ('license_plate', 'vehicle_type', 'last_updated')
    # Make it Read-Only (Safety First!)
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(ClientOrganization)
class ClientOrganizationAdmin(admin.ModelAdmin):
    # Removed 'owner_name' and 'phone'
    list_display = ('name', 'address', 'created_at') 
    search_fields = ('name',)
    
    def has_add_permission(self, request):
        return True
    def has_change_permission(self, request, obj=None):
        return True
    def has_delete_permission(self, request, obj=None):
        return False