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

# 3. THE TRUCK
class Vehicle(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    license_plate = models.CharField(max_length=15, unique=True)
    vehicle_type = models.CharField(max_length=50)
    gps_device_id = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return self.license_plate

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
    
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    
    # Financials
    allowance_given = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Sangu
    actual_fuel_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0) # Bon Solar
    actual_toll_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    other_expense = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_expense(self):
        return self.actual_fuel_cost + self.actual_toll_cost + self.other_expense

    @property
    def balance(self):
        return self.allowance_given - self.total_expense