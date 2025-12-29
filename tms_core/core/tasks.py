from celery import shared_task
from .services.traccar import sync_devices_from_traccar

@shared_task
def sync_device_statuses():
    """
    Periodic task to sync device statuses from Traccar as a safety net.
    Recommended schedule: Every 15 minutes.
    """
    print("Running scheduled device status sync...")
    result = sync_devices_from_traccar()
    print(f"Sync result: {result}")
    return result
