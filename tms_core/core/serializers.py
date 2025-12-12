from rest_framework import serializers
from .models import Organization, User, Vehicle, Trip, Customer, Route, VehiclePosition


# 1. Organization Serializer
class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'address']

# 2. Master Data Serializers
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'

# 3. Vehicle Serializer
class VehicleSerializer(serializers.ModelSerializer):
    # Calculated Status for Frontend (Green, Yellow, Red)
    computed_status = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'license_plate', 'vehicle_type', 'gps_device_id', 
            'last_latitude', 'last_longitude', 'last_updated', 
            'last_heading', 'last_speed', 'last_ignition',
            'current_odometer', 'last_service_odometer',
            'stnk_expiry', 'kir_expiry', 'tax_expiry',
            'computed_status'
        ]

    def get_computed_status(self, obj):
        if obj.last_speed > 10:
            return 'MOVING'
        elif obj.last_ignition and obj.last_speed <= 10:
            return 'IDLE'
        else:
            return 'STOPPED'

class VehiclePositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehiclePosition
        fields = ['latitude', 'longitude', 'speed', 'heading', 'ignition', 'timestamp']

# 4. Trip Serializer (The Money)
class TripSerializer(serializers.ModelSerializer):
    # Include the calculated fields (Read Only)
    total_expense = serializers.ReadOnlyField()
    balance = serializers.ReadOnlyField()
    profit = serializers.ReadOnlyField()
    
    # Show truck name instead of just ID
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    driver_name = serializers.CharField(source='driver.username', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'phone', 'current_debt']