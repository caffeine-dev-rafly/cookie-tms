from rest_framework import serializers
from django.utils import timezone
from .models import Organization, User, Vehicle, Trip, Customer, Route, VehiclePosition, SuratJalanHistory, DeliveryProof


def generate_surat_number():
    """
    Generate incrementing Surat Jalan number per day.
    Format: SJ-YYYYMMDD-XXXX
    """
    today = timezone.localdate()
    prefix = today.strftime("SJ-%Y%m%d")
    last_trip = Trip.objects.filter(surat_jalan_number__startswith=prefix).order_by('-id').first()
    next_seq = 1
    if last_trip and last_trip.surat_jalan_number:
        parts = last_trip.surat_jalan_number.split('-')
        if parts and parts[-1].isdigit():
            next_seq = int(parts[-1]) + 1
    return f"{prefix}-{next_seq:04d}"


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

class DeliveryProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProof
        fields = ['id', 'destination', 'proof_of_delivery', 'latitude', 'longitude', 'timestamp']

# 4. Trip Serializer (The Money)
class TripSerializer(serializers.ModelSerializer):
    # Include the calculated fields (Read Only)
    total_expense = serializers.ReadOnlyField()
    balance = serializers.ReadOnlyField()
    profit = serializers.ReadOnlyField()
    destinations = serializers.ListField(child=serializers.CharField(), required=False)
    completed_destinations = serializers.ListField(child=serializers.CharField(), required=False)
    delivery_proofs = DeliveryProofSerializer(many=True, read_only=True)
    
    # Show truck name instead of just ID
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    driver_name = serializers.CharField(source='driver.username', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'

    def validate(self, attrs):
        # Prevent multiple active departures for the same driver or vehicle
        instance = getattr(self, 'instance', None)
        vehicle = attrs.get('vehicle') or (instance.vehicle if instance else None)
        driver = attrs.get('driver') or (instance.driver if instance else None)
        destinations = attrs.get('destinations') or (instance.destinations if instance else [])
        legacy_dest = attrs.get('destination') or (instance.destination if instance else None)
        if not destinations and legacy_dest:
            destinations = [legacy_dest]
        completed = attrs.get('completed_destinations') or (instance.completed_destinations if instance else [])

        active_statuses = ['PLANNED', 'OTW']
        qs = Trip.objects.filter(status__in=active_statuses)
        if instance:
            qs = qs.exclude(pk=instance.pk)

        conflicts = []
        if vehicle and qs.filter(vehicle=vehicle).exists():
            conflicts.append('vehicle')
        if driver and qs.filter(driver=driver).exists():
            conflicts.append('driver')

        if conflicts:
            raise serializers.ValidationError(
                f"Active trip already exists for this {', '.join(conflicts)}. Complete or cancel it first."
            )

        # Completed destinations must be subset of destinations
        if completed and destinations:
            extra = [d for d in completed if d not in destinations]
            if extra:
                raise serializers.ValidationError("Completed destinations must be part of the assigned destinations.")

        return super().validate(attrs)

    def create(self, validated_data):
        destinations = validated_data.pop('destinations', [])
        if isinstance(destinations, str):
            destinations = [destinations]

        completed_dest = validated_data.pop('completed_destinations', [])
        if isinstance(completed_dest, str):
            completed_dest = [completed_dest]

        # Keep legacy destination filled for compatibility
        if destinations and not validated_data.get('destination'):
            validated_data['destination'] = destinations[0]
        validated_data['destinations'] = destinations
        validated_data['completed_destinations'] = [d for d in completed_dest if d in destinations] if destinations else []

        # Autogenerate surat jalan number when empty
        sj_number = validated_data.get('surat_jalan_number')
        if not sj_number:
            validated_data['surat_jalan_number'] = generate_surat_number()

        trip = super().create(validated_data)
        SuratJalanHistory.objects.create(trip=trip, surat_jalan_number=trip.surat_jalan_number)
        return trip

    def update(self, instance, validated_data):
        destinations = validated_data.pop('destinations', None)
        if destinations is not None:
            if isinstance(destinations, str):
                destinations = [destinations]
            validated_data['destinations'] = destinations
            if destinations and not validated_data.get('destination'):
                validated_data['destination'] = destinations[0]

        completed_dest = validated_data.pop('completed_destinations', None)
        if completed_dest is not None:
            if isinstance(completed_dest, str):
                completed_dest = [completed_dest]
            validated_data['completed_destinations'] = completed_dest

        old_sj_number = instance.surat_jalan_number
        new_sj_number = validated_data.get('surat_jalan_number')
        if new_sj_number == '':
            validated_data.pop('surat_jalan_number', None)
            new_sj_number = None
        instance = super().update(instance, validated_data)

        if new_sj_number and new_sj_number != old_sj_number:
            SuratJalanHistory.objects.create(trip=instance, surat_jalan_number=new_sj_number)

        return instance


class SuratJalanHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SuratJalanHistory
        fields = ['surat_jalan_number', 'changed_at']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'phone', 'current_debt', 'password', 'organization']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
