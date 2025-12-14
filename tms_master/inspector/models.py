from django.db import models

class Organization(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField()
    settings = models.JSONField(default=dict, blank=True) 

    class Meta:
        managed = False
        db_table = 'core_organization'
        app_label = 'inspector'

    def __str__(self):
        return self.name

class User(models.Model):
    # Mapping to core_user
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField()
    
    # Custom fields from core.User
    organization = models.ForeignKey(Organization, on_delete=models.DO_NOTHING, null=True, blank=True)
    role = models.CharField(max_length=10)
    phone = models.CharField(max_length=20, blank=True)
    current_debt = models.DecimalField(max_digits=12, decimal_places=0, default=0)

    class Meta:
        managed = False
        db_table = 'core_user'
        app_label = 'inspector'

    def __str__(self):
        return self.username

class Customer(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        managed = False
        db_table = 'core_customer'
        app_label = 'inspector'

    def __str__(self):
        return self.name

class Vehicle(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.DO_NOTHING)
    license_plate = models.CharField(max_length=15)
    vehicle_type = models.CharField(max_length=50)
    gps_device_id = models.CharField(max_length=50, blank=True, null=True)
    
    last_latitude = models.FloatField(default=0.0)
    last_longitude = models.FloatField(default=0.0)
    last_updated = models.DateTimeField() 
    last_heading = models.FloatField(default=0.0) 
    last_speed = models.FloatField(default=0.0) 
    last_ignition = models.BooleanField(default=False) 

    current_odometer = models.IntegerField(default=0) 
    last_service_odometer = models.IntegerField(default=0) 
    
    stnk_expiry = models.DateField(null=True, blank=True)
    kir_expiry = models.DateField(null=True, blank=True)
    tax_expiry = models.DateField(null=True, blank=True) 

    class Meta:
        managed = False
        db_table = 'core_vehicle'
        app_label = 'inspector'

    def __str__(self):
        return self.license_plate

class Trip(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.DO_NOTHING)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.DO_NOTHING)
    driver = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    customer = models.ForeignKey(Customer, on_delete=models.DO_NOTHING, null=True, blank=True)
    
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    destinations = models.JSONField(default=list, blank=True)
    completed_destinations = models.JSONField(default=list, blank=True)
    cargo_type = models.CharField(max_length=50, blank=True)
    surat_jalan_number = models.CharField(max_length=50, blank=True, null=True)
    
    revenue = models.DecimalField(max_digits=12, decimal_places=0, default=0) 
    allowance_given = models.DecimalField(max_digits=12, decimal_places=0, default=0) 
    
    actual_fuel_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0) 
    actual_fuel_liters = models.FloatField(default=0) 
    
    actual_toll_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    unloading_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0) 
    other_expense = models.DecimalField(max_digits=12, decimal_places=0, default=0) 
    
    status = models.CharField(max_length=20, default='PLANNED')
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'core_trip'
        app_label = 'inspector'

from django.db import models

class ClientVehicle(models.Model):
    # We copy the fields exactly as they appear in the Client App
    license_plate = models.CharField(max_length=20)
    vehicle_type = models.CharField(max_length=50)
    gps_device_id = models.CharField(max_length=50)
    last_latitude = models.FloatField()
    last_longitude = models.FloatField()
    last_updated = models.DateTimeField()

    class Meta:
        # 1. Don't let Django manage this table (It already exists)
        managed = False 
        # 2. Point to the table name in the Client DB
        # (Standard Django naming: appname_modelname -> core_vehicle)
        db_table = 'core_vehicle' 
        verbose_name = 'Client Vehicle'
        verbose_name_plural = 'Client Vehicles'

    def __str__(self):
        return f"{self.license_plate} ({self.vehicle_type})"
class ClientOrganization(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    # The DB requires this field (Not Null), so we must include it
    settings = models.JSONField(default=dict) 

    class Meta:
        managed = False
        db_table = 'core_organization'
        verbose_name = 'Client Organization'
        verbose_name_plural = 'Client Organizations'

    def __str__(self):
        return self.name