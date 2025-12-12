from django.db import models
from django.contrib.auth.models import AbstractUser

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

    @property
    def total_expense(self):
        return self.actual_fuel_cost + self.actual_toll_cost + self.unloading_cost + self.other_expense

    @property
    def balance(self):
        return self.allowance_given - self.total_expense
        
    @property
    def profit(self):
        return self.revenue - self.allowance_given - (self.total_expense if self.balance < 0 else 0)


class SuratJalanHistory(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='surat_histories')
    surat_jalan_number = models.CharField(max_length=50)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
