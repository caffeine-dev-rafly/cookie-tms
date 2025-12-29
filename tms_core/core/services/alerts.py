from ..models import Notification, User

WATCH_ROLES = ['OWNER', 'ADMIN']
STOP_SPEED_THRESHOLD = 5.0  # km/h threshold for considering a vehicle stopped
DEFAULT_STOP_MINUTES = 5
DEFAULT_OFFLINE_MINUTES = 10


def _build_message(vehicle, alert_type, duration_minutes):
    minutes = max(1, int(duration_minutes))
    if alert_type == 'VEHICLE_STOP':
        return f"Vehicle {vehicle.license_plate} has been stopped for {minutes} minutes."
    return f"Vehicle {vehicle.license_plate} GPS has been offline for {minutes} minutes."


def build_alert_key(alert_type, vehicle, started_at):
    base = int(started_at.timestamp()) if started_at else 0
    return f"{alert_type}:{vehicle.id}:{base}"


def notify_vehicle_event(vehicle, alert_type, started_at, duration_minutes):
    """
    Fan out notifications to owner/staff users whose configured threshold has been exceeded.
    Returns the number of notifications created.
    """
    if not vehicle.organization_id or not started_at:
        return 0

    key = build_alert_key(alert_type, vehicle, started_at)
    watchers = User.objects.filter(organization=vehicle.organization, role__in=WATCH_ROLES)
    created = 0
    for watcher in watchers:
        threshold = watcher.stop_alert_minutes if alert_type == 'VEHICLE_STOP' else watcher.offline_alert_minutes
        if alert_type == 'VEHICLE_STOP':
            threshold = threshold or DEFAULT_STOP_MINUTES
        else:
            threshold = threshold or DEFAULT_OFFLINE_MINUTES

        if duration_minutes < threshold:
            continue

        if Notification.objects.filter(user=watcher, alert_key=key).exists():
            continue

        Notification.objects.create(
            user=watcher,
            message=_build_message(vehicle, alert_type, duration_minutes),
            category=alert_type,
            reference_id=str(vehicle.id),
            alert_key=key,
        )
        created += 1

    return created
