from django.db import models
from django.contrib.auth.models import AbstractUser
import requests
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from requests.auth import HTTPBasicAuth
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

# 1. THE TENANT (The Client Company)
class Organization(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # Feature Flags (For future "Mods")
    settings = models.JSONField(default=dict, blank=True) 

    def __str__(self):
        return self.name

# 2. THE USER (Boss, Admin, Driver)
class User(AbstractUser):
    ROLES = (
        ('OWNER', 'Owner'),
        ('ADMIN', 'Admin'),
        ('DRIVER', 'Driver'),
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLES, default='ADMIN')
    phone = models.CharField(max_length=20, blank=True)
    # MODULE 2: FINANCE (Driver Debt)
    current_debt = models.DecimalField(max_digits=12, decimal_places=0, default=0)

    def __str__(self):
        return self.username

# 3. MASTER DATA (Module 4)
class Customer(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return self.name

class Route(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    standard_distance_km = models.IntegerField(default=0)
    standard_fuel_liters = models.IntegerField(default=0)
    standard_revenue = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Standard Price
    
    def __str__(self):
        return f"{self.origin} -> {self.destination}"

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
        ('OTW', 'On The Way'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT)
    driver = models.ForeignKey(User, on_delete=models.PROTECT, limit_choices_to={'role': 'DRIVER'})
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    destinations = models.JSONField(default=list, blank=True)
    completed_destinations = models.JSONField(default=list, blank=True)
    cargo_type = models.CharField(max_length=50, blank=True)
    surat_jalan_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Financials
    revenue = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Ongkos Angkut
    allowance_given = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Sangu
    
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
            
    except Exception as e:
        print(f"Error syncing to Traccar: {e}")

@receiver(post_save, sender=User)
def assign_default_permissions(sender, instance, created, **kwargs):
    """
    Automatically adds 'Staff' users to the 'Client Manager' group
    and grants them access to Business Models.
    """
    # Only act if it's a Staff member (Client) and NOT a Superuser (You)
    if instance.is_staff and not instance.is_superuser:
        
        # 1. Get or Create the 'Client Manager' Group
        group, group_created = Group.objects.get_or_create(name='Client Manager')

        # 2. If we just created the group, define what it can do
        if group_created:
            # List of models they can Manage (Add/View/Change/Delete)
            models_to_grant = ['vehicle', 'driver', 'customer', 'route', 'trip', 'user']
            
            permissions_to_add = []
            for model_name in models_to_grant:
                try:
                    # Find the ContentType (Database ID for the model)
                    ct = ContentType.objects.get(app_label='core', model=model_name)
                    # Get all permissions for this model (add, change, delete, view)
                    perms = Permission.objects.filter(content_type=ct)
                    for p in perms:
                        permissions_to_add.append(p)
                except ContentType.DoesNotExist:
                    print(f"Warning: Model {model_name} not found when assigning permissions.")

            # Assign permissions to the group
            group.permissions.set(permissions_to_add)
            group.save()
            print("Created 'Client Manager' group with default permissions.")

        # 3. Add the User to the Group
        instance.groups.add(group)
        print(f"Assigned {instance.username} to 'Client Manager' group.")