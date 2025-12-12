from rest_framework import serializers
from .models import Organization, User, Vehicle, Trip

# 1. Organization Serializer
class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'address']

# 2. Vehicle Serializer
class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'license_plate', 'vehicle_type', 'gps_device_id']

# 3. Trip Serializer (The Money)
class TripSerializer(serializers.ModelSerializer):
    # Include the calculated fields (Read Only)
    total_expense = serializers.ReadOnlyField()
    balance = serializers.ReadOnlyField()
    
    # Show truck name instead of just ID
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    driver_name = serializers.CharField(source='driver.username', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'