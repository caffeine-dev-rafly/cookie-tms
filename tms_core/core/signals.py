from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ActivityLog, Organization, User, Customer, Route, Origin, Vehicle, Trip, VehicleEvent
from .middleware import get_current_user, get_current_request
from .services.traccar import sync_origin_geofence, sync_customer_geofence

TRACKED_MODELS = [Organization, User, Customer, Route, Origin, Vehicle, Trip, VehicleEvent]

@receiver(post_save, sender=Origin)
def sync_origin_geofence_on_save(sender, instance, **kwargs):
    update_fields = kwargs.get('update_fields')
    if update_fields and set(update_fields).issubset({'traccar_id'}):
        return
    sync_origin_geofence(instance)

@receiver(post_save, sender=Customer)
def sync_customer_geofence_on_save(sender, instance, **kwargs):
    update_fields = kwargs.get('update_fields')
    if update_fields and set(update_fields).issubset({'traccar_id'}):
        return
    sync_customer_geofence(instance)

@receiver(post_save)
def log_save_activity(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return
    
    # Avoid logging changes to ActivityLog itself or other internal/noisy updates if needed
    
    user = get_current_user()
    req = get_current_request()
    
    # We log even if user is None (System action), or check is_authenticated
    # user_obj = user if (user and user.is_authenticated) else None 
    # For now, let's allow None to signify "System/Unknown" if it happens outside a request
    
    action = f"{sender.__name__.upper()}_{'CREATED' if created else 'UPDATED'}"
    
    try:
        details = {
            'id': instance.id,
            'str': str(instance)
        }
        # Add specific details for key models if needed
        if isinstance(instance, Trip):
            details['surat_jalan'] = instance.surat_jalan_number

        ActivityLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            action=action,
            details=details,
            ip_address=req.META.get('REMOTE_ADDR') if req else None
        )
    except Exception as e:
        print(f"Error logging activity: {e}")

@receiver(post_delete)
def log_delete_activity(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    user = get_current_user()
    req = get_current_request()

    action = f"{sender.__name__.upper()}_DELETED"

    try:
        details = {
            'id': instance.id,
            'str': str(instance)
        }
        
        ActivityLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            action=action,
            details=details,
            ip_address=req.META.get('REMOTE_ADDR') if req else None
        )
    except Exception as e:
        print(f"Error logging activity: {e}")
