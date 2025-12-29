from django.db import models
from django.contrib.auth.models import AbstractUser
import requests
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from requests.auth import HTTPBasicAuth
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db import transaction

# Device/Traccar status constants
DEVICE_STATUS_CHOICES = (
    ('ONLINE', 'Online'),
    ('OFFLINE', 'Offline'),
    ('UNKNOWN', 'Unknown'),
)

GEOFENCE_TYPE_CHOICES = (
    ('CIRCLE', 'Circle'),
    ('RECTANGLE', 'Rectangle'),
)

# 1. THE TENANT (The Client Company)
class Organization(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # Feature Flags (For future "Mods")
    settings = models.JSONField(default=dict, blank=True) 
    subscription_end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    driver_limit = models.PositiveIntegerField(default=0, help_text="0 means unlimited drivers")
    vehicle_limit = models.PositiveIntegerField(default=0, help_text="0 means unlimited vehicles")

    def __str__(self):
        return self.name

    def get_days_remaining(self):
        """
        Return the number of days between the subscription end date and today.
        Negative values indicate expiry; None when no end date is set.
        """
        if not self.subscription_end_date:
            return None
        return (self.subscription_end_date - timezone.localdate()).days

# 2. THE USER (Boss, Admin, Driver)
class User(AbstractUser):
    ROLES = (
        ('OWNER', 'Owner'),
        ('ADMIN', 'Admin'),
        ('FINANCE', 'Finance'),
        ('DRIVER', 'Driver'),
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLES, default='ADMIN')
    phone = models.CharField(max_length=20, blank=True)
    # MODULE 2: FINANCE (Driver Debt)
    current_debt = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    stop_alert_minutes = models.PositiveIntegerField(default=5)
    offline_alert_minutes = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.username

# 3. MASTER DATA (Module 4)
class Customer(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    traccar_id = models.IntegerField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    radius = models.IntegerField(default=200)
    geofence_type = models.CharField(max_length=20, choices=GEOFENCE_TYPE_CHOICES, default='CIRCLE')
    geofence_bounds = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class Route(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    origin_address = models.TextField(blank=True)
    destination_address = models.TextField(blank=True)
    standard_distance_km = models.IntegerField(default=0)
    standard_fuel_liters = models.IntegerField(default=0)
    standard_revenue = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Standard Price
    standard_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estimated_fuel_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.origin} -> {self.destination}"

class Origin(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    traccar_id = models.IntegerField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    radius = models.IntegerField(default=200)
    is_origin = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Vehicle(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    license_plate = models.CharField(max_length=15, unique=True)
    vehicle_type = models.CharField(max_length=50)
    gps_device_id = models.CharField(max_length=50, blank=True, null=True)
    
    # NEW FIELDS: Store the last known position
    last_latitude = models.FloatField(default=0.0)
    last_longitude = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True) # Auto-updates timestamp
    last_heading = models.FloatField(default=0.0) # 0 = North
    last_speed = models.FloatField(default=0.0) # km/h
    last_ignition = models.BooleanField(default=False) # Engine status
    device_status = models.CharField(max_length=20, choices=DEVICE_STATUS_CHOICES, default='UNKNOWN')
    device_status_changed_at = models.DateTimeField(null=True, blank=True)
    stopped_since = models.DateTimeField(null=True, blank=True)
    last_gps_sync = models.DateTimeField(null=True, blank=True)

    # FLEET HEALTH (Module 3)
    current_odometer = models.IntegerField(default=0) # Total Km
    last_service_odometer = models.IntegerField(default=0) # Km at last service
    
    stnk_expiry = models.DateField(null=True, blank=True)
    kir_expiry = models.DateField(null=True, blank=True)
    tax_expiry = models.DateField(null=True, blank=True) # Pajak

    def __str__(self):
        return self.license_plate

# HISTORY LOG (For Playback)
class VehiclePosition(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='positions')
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(default=0)
    heading = models.FloatField(default=0)
    ignition = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

# 4. THE MONEY (Uang Jalan Logic)
class Trip(models.Model):
    STATUS_CHOICES = (
        ('PLANNED', 'Planned'),
        ('ARRIVED', 'Arrived'),
        ('OTW', 'On The Way'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('SETTLED', 'Settled'),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT)
    driver = models.ForeignKey(User, on_delete=models.PROTECT, limit_choices_to={'role': 'DRIVER'})
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    customers = models.ManyToManyField(Customer, blank=True, related_name='shared_trips')
    origin_location = models.ForeignKey(Origin, on_delete=models.SET_NULL, null=True, blank=True, related_name='trips')
    invoice = models.ForeignKey('finance.Invoice', on_delete=models.SET_NULL, null=True, blank=True)
    
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    destinations = models.JSONField(default=list, blank=True)
    completed_destinations = models.JSONField(default=list, blank=True)
    cargo_type = models.CharField(max_length=50, blank=True)
    surat_jalan_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Financials
    revenue = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Ongkos Angkut
    allowance_given = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Sangu
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Revenue for invoicing
    driver_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Expense for invoicing
    driver_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_returned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_odometer = models.IntegerField(default=0)
    
    # Settlement (Real Costs)
    actual_fuel_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Bon Solar
    actual_fuel_liters = models.FloatField(default=0) # Solar (Liters)
    
    actual_toll_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    unloading_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Mel/Kuli
    other_expense = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    created_at = models.DateTimeField(auto_now_add=True)

    # Legacy field - consider moving to DeliveryProof if full migration
    proof_of_delivery = models.ImageField(upload_to='pod/', blank=True, null=True)
    drop_latitude = models.FloatField(blank=True, null=True)  # Verify location
    drop_longitude = models.FloatField(blank=True, null=True) # Verify location
    completed_at = models.DateTimeField(blank=True, null=True)

    @property
    def total_expense(self):
        return self.actual_fuel_cost + self.actual_toll_cost + self.unloading_cost + self.other_expense

    @property
    def balance(self):
        return self.allowance_given - self.total_expense
        
    @property
    def profit(self):
        return self.revenue - self.allowance_given - (self.total_expense if self.balance < 0 else 0)

    @property
    def final_profit(self):
        """
        Settlement-based profit: trip price minus (actual expenses + cash returned + driver commission).
        """
        base_revenue = self.price or self.revenue
        return base_revenue - ((self.actual_expenses or 0) + (self.cash_returned or 0) + (self.driver_commission or 0))


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    category = models.CharField(max_length=50, blank=True)
    reference_id = models.CharField(max_length=100, blank=True)
    alert_key = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:30]}"

class DeliveryProof(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='delivery_proofs')
    destination = models.CharField(max_length=100)
    proof_of_delivery = models.ImageField(upload_to='pod/', blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trip.surat_jalan_number} - {self.destination}"

class SuratJalanHistory(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='surat_histories')
    surat_jalan_number = models.CharField(max_length=50)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

@receiver(post_save, sender=Vehicle)
def sync_vehicle_to_traccar(sender, instance, created, **kwargs):
    """
    Automatically creates/updates the device in Traccar 
    whenever a Vehicle is saved in Django.
    """
    if not instance.gps_device_id:
        return

    # 1. Prepare Data for Traccar
    device_data = {
        "name": instance.license_plate,
        "uniqueId": instance.gps_device_id,
        # 'category': 'truck' # Optional
    }

    # 2. Check if device exists first (to decide: Create or Update?)
    auth = HTTPBasicAuth(settings.TRACCAR_USER, settings.TRACCAR_PASSWORD)
    search_url = f"{settings.TRACCAR_URL}/api/devices?uniqueId={instance.gps_device_id}"
    
    try:
        response = requests.get(search_url, auth=auth)
        if response.status_code == 200 and len(response.json()) > 0:
            # Device exists -> UPDATE it
            traccar_id = response.json()[0]['id']
            device_data['id'] = traccar_id
            requests.put(f"{settings.TRACCAR_URL}/api/devices/{traccar_id}", json=device_data, auth=auth)
            print(f"Updated Traccar Device: {instance.license_plate}")
        else:
            # Device does not exist -> CREATE it
            requests.post(f"{settings.TRACCAR_URL}/api/devices", json=device_data, auth=auth)
            print(f"Created Traccar Device: {instance.license_plate}")

        from .services.traccar import sync_vehicle_geofence_permissions
        sync_vehicle_geofence_permissions(instance)
            
    except Exception as e:
        print(f"Error syncing to Traccar: {e}")

@receiver(post_save, sender=User)
def assign_default_permissions(sender, instance, created, **kwargs):
    """
    Automatically adds Owner users to the 'Client Manager' group
    and grants them access to Business Models.
    """
    group, group_created = Group.objects.get_or_create(name='Client Manager')

    if group_created:
        models_to_grant = ['vehicle', 'driver', 'customer', 'route', 'trip', 'user']
        permissions_to_add = []
        for model_name in models_to_grant:
            try:
                ct = ContentType.objects.get(app_label='core', model=model_name)
                perms = Permission.objects.filter(content_type=ct)
                for p in perms:
                    permissions_to_add.append(p)
            except ContentType.DoesNotExist:
                print(f"Warning: Model {model_name} not found when assigning permissions.")

        group.permissions.set(permissions_to_add)
        group.save()
        print("Created 'Client Manager' group with default permissions.")

    if instance.is_superuser or instance.role != 'OWNER' or not instance.is_staff:
        # Ensure non-owner staff are not in the Client Manager group
        instance.groups.remove(group)
        return

    instance.groups.add(group)
    print(f"Assigned {instance.username} to 'Client Manager' group.")


def _create_notification_for_roles(organization, roles, message):
    users = User.objects.filter(organization=organization, role__in=roles)
    for u in users:
        Notification.objects.create(user=u, message=message)


@receiver(post_save, sender=Organization)
def notify_subscription_warning(sender, instance, **kwargs):
    days_remaining = instance.get_days_remaining()
    if days_remaining == 3:
        msg = f"Subscription for {instance.name} expires in 3 days."
        existing = Notification.objects.filter(user__organization=instance, message=msg, is_read=False)
        if not existing.exists():
            _create_notification_for_roles(instance, ['OWNER', 'ADMIN'], msg)

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"[{self.created_at}] {user_str}: {self.action}"

class DeviceLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='device_logs')
    status = models.CharField(max_length=20, choices=DEVICE_STATUS_CHOICES)
    message = models.TextField(blank=True)
    event_time = models.DateTimeField(default=timezone.now)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.vehicle.license_plate}: {self.status} @ {self.event_time}"

class VehicleEvent(models.Model):
    EVENT_TYPES = (
        ('STOP', 'Stop'),
        ('OFFLINE', 'Offline'),
        ('IDLE', 'Idle'),
    )
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_minutes = models.FloatField(default=0.0)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.event_type} ({self.duration_minutes} mins)"
