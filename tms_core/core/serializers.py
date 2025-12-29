from rest_framework import serializers
from django.utils import timezone
from .models import Organization, User, Vehicle, Trip, Customer, Route, Origin, VehiclePosition, SuratJalanHistory, DeliveryProof, Notification


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
        fields = ['id', 'name', 'address', 'subscription_end_date', 'is_active', 'driver_limit', 'vehicle_limit']

# 2. Master Data Serializers
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'

# 3. Origin Serializer
class OriginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Origin
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
            'device_status', 'device_status_changed_at',
            'stopped_since', 'last_gps_sync',
            'current_odometer', 'last_service_odometer',
            'stnk_expiry', 'kir_expiry', 'tax_expiry',
            'computed_status'
        ]

    def get_computed_status(self, obj):
        # Webhook-driven status overrides other heuristics
        if obj.device_status == 'OFFLINE':
            return 'OFFLINE'

        # 1. Check Offline first
        if obj.last_gps_sync:
            # Use user config or default 10 minutes
            threshold_minutes = obj.user.offline_alert_minutes if (hasattr(obj, 'user') and obj.user) else 10
            # If vehicle organization owner overrides default
            if not getattr(obj, 'user', None) and obj.organization:
                 # Try to find owner config - optional, for now hardcode 10 or check if obj has a related user config
                 pass
            
            elapsed = (timezone.now() - obj.last_gps_sync).total_seconds() / 60
            if elapsed > threshold_minutes:
                return 'OFFLINE'

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
    final_profit = serializers.ReadOnlyField()
    invoiced = serializers.SerializerMethodField()
    customers = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), many=True, required=False)
    origin_location = serializers.PrimaryKeyRelatedField(queryset=Origin.objects.all(), allow_null=True, required=False)
    customer_names = serializers.SerializerMethodField()
    origin_location_name = serializers.SerializerMethodField()
    origin_location_address = serializers.SerializerMethodField()
    origin_location_latitude = serializers.SerializerMethodField()
    origin_location_longitude = serializers.SerializerMethodField()
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

        active_statuses = ['PLANNED', 'OTW', 'ARRIVED']
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

        if 'customers' in attrs and not attrs.get('customer'):
            customers = attrs.get('customers') or []
            attrs['customer'] = customers[0] if customers else None

        if attrs.get('origin_location') and not attrs.get('origin'):
            attrs['origin'] = attrs['origin_location'].name

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

    def get_customer_names(self, obj):
        names = [c.name for c in obj.customers.all()]
        if not names and obj.customer_id:
            names = [obj.customer.name]
        return names

    def get_origin_location_name(self, obj):
        return obj.origin_location.name if obj.origin_location else None

    def get_origin_location_address(self, obj):
        return obj.origin_location.address if obj.origin_location else None

    def get_origin_location_latitude(self, obj):
        return obj.origin_location.latitude if obj.origin_location else None

    def get_origin_location_longitude(self, obj):
        return obj.origin_location.longitude if obj.origin_location else None

    def get_invoiced(self, obj):
        return bool(getattr(obj, 'invoice_id', None))


class SuratJalanHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SuratJalanHistory
        fields = ['surat_jalan_number', 'changed_at']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    computed_role = serializers.SerializerMethodField()
    organization_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'role', 'computed_role', 
            'phone', 'current_debt', 'stop_alert_minutes', 'offline_alert_minutes',
            'password', 'organization', 'organization_status'
        ]

    def get_computed_role(self, user):
        # Role Logic matching CustomTokenObtainPairSerializer
        if user.is_superuser:
            return "super_admin"
        elif user.role == 'OWNER' or user.groups.filter(name="Client Manager").exists():
            return "owner"
        elif user.role == 'FINANCE':
            return "finance"
        elif user.is_staff:
            return "staff"
        else:
            return "driver"

    def get_organization_status(self, user):
        if not user.organization:
            return 'active'
        
        days_remaining = user.organization.get_days_remaining()
        if not user.organization.is_active:
            return 'suspended'
        elif user.organization.subscription_end_date and days_remaining is not None and days_remaining < 0:
            return 'expired'
        elif days_remaining is not None and days_remaining <= 3:
            return 'expiring'
        return 'active'

    def validate(self, attrs):
        request = self.context.get('request')
        role = attrs.get('role') or getattr(self.instance, 'role', None)
        stop_minutes = attrs.get('stop_alert_minutes')
        offline_minutes = attrs.get('offline_alert_minutes')

        for value in [stop_minutes, offline_minutes]:
            if value is not None and value <= 0:
                raise serializers.ValidationError("Alert minutes must be greater than zero.")

        if request and not request.user.is_superuser:
            # If editing existing user, skip owner/org checks if role/org not changing
            # But for simplicity, we keep the logic: only superuser creates OWNER.
            if not self.instance: # Creation
                if attrs.get('role') == 'OWNER':
                    raise serializers.ValidationError("Owners can only create staff, finance, or driver users.")
                attrs['organization'] = request.user.organization

        organization = attrs.get('organization') or getattr(self.instance, 'organization', None)

        if role in ['ADMIN', 'FINANCE'] and not organization:
            raise serializers.ValidationError("Organization is required for staff/finance users.")

        if role == 'DRIVER' and organization and organization.driver_limit:
            qs = User.objects.filter(organization=organization, role='DRIVER')
            if self.instance and self.instance.pk:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.count() >= organization.driver_limit:
                raise serializers.ValidationError("Driver limit reached for this organization. Increase the cap to add more drivers.")

        return super().validate(attrs)

    def _apply_staff_flags(self, user_obj):
        """
        Set Django flags based on role.
        """
        if user_obj.is_superuser:
            user_obj.is_staff = True
            user_obj.save(update_fields=['is_staff'])
            return

        role = user_obj.role
        if role in ['ADMIN', 'FINANCE', 'OWNER']:
            user_obj.is_staff = True
        else:
            user_obj.is_staff = False
        user_obj.save(update_fields=['is_staff'])

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        self._apply_staff_flags(user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        self._apply_staff_flags(user)
        return user


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'category', 'reference_id', 'created_at']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        self._apply_staff_flags(user)
        return user

from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'action', 'details', 'ip_address', 'created_at']
