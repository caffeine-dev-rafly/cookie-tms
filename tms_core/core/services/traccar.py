import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from ..models import Vehicle, VehiclePosition, DeviceLog, Origin, Customer
from .alerts import notify_vehicle_event, STOP_SPEED_THRESHOLD

def _normalize_status(raw_status):
    if not raw_status:
        return 'UNKNOWN'
    normalized = raw_status.lower()
    if normalized == 'online':
        return 'ONLINE'
    if normalized == 'offline':
        return 'OFFLINE'
    return 'UNKNOWN'

def _get_traccar_auth():
    return HTTPBasicAuth(settings.TRACCAR_USER, settings.TRACCAR_PASSWORD)

def _get_traccar_base_url():
    return settings.TRACCAR_URL.rstrip('/')

def _build_geofence_area(latitude, longitude, radius):
    return f"CIRCLE({latitude} {longitude}, {radius})"

def _build_polygon_area(points):
    if not points:
        return None
    serialized = ', '.join([f"{lat} {lon}" for lat, lon in points])
    return f"POLYGON(({serialized}))"

def _normalize_bounds(bounds):
    if not bounds or not isinstance(bounds, dict):
        return None
    try:
        north = float(bounds.get('north'))
        south = float(bounds.get('south'))
        east = float(bounds.get('east'))
        west = float(bounds.get('west'))
    except (TypeError, ValueError):
        return None
    if north == south or east == west:
        return None
    return {
        'north': max(north, south),
        'south': min(north, south),
        'east': max(east, west),
        'west': min(east, west),
    }

def _build_rectangle_area(bounds):
    normalized = _normalize_bounds(bounds)
    if not normalized:
        return None
    north = normalized['north']
    south = normalized['south']
    east = normalized['east']
    west = normalized['west']
    points = [
        (north, west),
        (north, east),
        (south, east),
        (south, west),
        (north, west),
    ]
    return _build_polygon_area(points)

def _get_org_vehicle_unique_ids(organization_id):
    if not organization_id:
        return []
    return list(
        Vehicle.objects.filter(organization_id=organization_id)
        .exclude(gps_device_id__isnull=True)
        .exclude(gps_device_id__exact='')
        .values_list('gps_device_id', flat=True)
    )

def _fetch_traccar_devices(auth, base_url):
    devices_res = requests.get(f"{base_url}/api/devices", auth=auth, timeout=10)
    if devices_res.status_code != 200:
        print(f"Traccar geofence permissions failed: devices {devices_res.status_code}")
        return []
    return devices_res.json() or []

def _link_geofence_to_devices(geofence_id, auth, base_url, vehicle_unique_ids=None):
    try:
        devices = _fetch_traccar_devices(auth, base_url)
        if vehicle_unique_ids is not None:
            allowed_unique_ids = {str(uid) for uid in vehicle_unique_ids if uid}
            devices = [device for device in devices if str(device.get('uniqueId')) in allowed_unique_ids]

        existing_device_ids = set()
        perm_res = requests.get(
            f"{base_url}/api/permissions?geofenceId={geofence_id}",
            auth=auth,
            timeout=10
        )
        if perm_res.status_code == 200:
            existing_device_ids = {
                perm.get('deviceId') for perm in (perm_res.json() or []) if perm.get('deviceId') is not None
            }

        for device in devices:
            device_id = device.get('id')
            if device_id is None or device_id in existing_device_ids:
                continue
            payload = {'deviceId': device_id, 'geofenceId': geofence_id}
            requests.post(f"{base_url}/api/permissions", json=payload, auth=auth, timeout=10)
    except Exception as exc:
        print(f"Traccar geofence permission error: {exc}")

def sync_origin_geofence(origin):
    if origin.latitude is None or origin.longitude is None:
        return {'status': 'skipped', 'reason': 'missing_coords'}

    auth = _get_traccar_auth()
    base_url = _get_traccar_base_url()
    radius = origin.radius or 200
    payload = {
        'name': origin.name,
        'description': origin.address or '',
        'area': _build_geofence_area(origin.latitude, origin.longitude, radius),
    }

    geofence_id = origin.traccar_id

    try:
        if geofence_id:
            update_payload = {**payload, 'id': geofence_id}
            resp = requests.put(
                f"{base_url}/api/geofences/{geofence_id}",
                json=update_payload,
                auth=auth,
                timeout=10
            )
            if resp.status_code == 404:
                geofence_id = None
            elif resp.status_code not in (200, 204):
                return {'status': 'failed', 'reason': f'update_failed_{resp.status_code}'}

        if not geofence_id:
            resp = requests.post(
                f"{base_url}/api/geofences",
                json=payload,
                auth=auth,
                timeout=10
            )
            if resp.status_code not in (200, 201):
                return {'status': 'failed', 'reason': f'create_failed_{resp.status_code}'}
            data = resp.json() or {}
            geofence_id = data.get('id')
            if geofence_id and geofence_id != origin.traccar_id:
                Origin.objects.filter(pk=origin.pk).update(traccar_id=geofence_id)
                origin.traccar_id = geofence_id

        if geofence_id:
            vehicle_unique_ids = _get_org_vehicle_unique_ids(origin.organization_id)
            _link_geofence_to_devices(geofence_id, auth, base_url, vehicle_unique_ids)

        return {'status': 'success', 'geofence_id': geofence_id}
    except Exception as exc:
        print(f"Traccar geofence sync error: {exc}")
        return {'status': 'error', 'reason': str(exc)}

def sync_customer_geofence(customer):
    auth = _get_traccar_auth()
    base_url = _get_traccar_base_url()
    geofence_type = (customer.geofence_type or 'CIRCLE').upper()
    area = None

    if geofence_type == 'RECTANGLE':
        area = _build_rectangle_area(customer.geofence_bounds)
        if not area:
            return {'status': 'skipped', 'reason': 'missing_bounds'}
    else:
        if customer.latitude is None or customer.longitude is None:
            return {'status': 'skipped', 'reason': 'missing_coords'}
        radius = customer.radius or 200
        area = _build_geofence_area(customer.latitude, customer.longitude, radius)

    payload = {
        'name': customer.name,
        'description': customer.address or '',
        'area': area,
    }

    geofence_id = customer.traccar_id

    try:
        if geofence_id:
            update_payload = {**payload, 'id': geofence_id}
            resp = requests.put(
                f"{base_url}/api/geofences/{geofence_id}",
                json=update_payload,
                auth=auth,
                timeout=10
            )
            if resp.status_code == 404:
                geofence_id = None
            elif resp.status_code not in (200, 204):
                return {'status': 'failed', 'reason': f'update_failed_{resp.status_code}'}

        if not geofence_id:
            resp = requests.post(
                f"{base_url}/api/geofences",
                json=payload,
                auth=auth,
                timeout=10
            )
            if resp.status_code not in (200, 201):
                return {'status': 'failed', 'reason': f'create_failed_{resp.status_code}'}
            data = resp.json() or {}
            geofence_id = data.get('id')
            if geofence_id and geofence_id != customer.traccar_id:
                Customer.objects.filter(pk=customer.pk).update(traccar_id=geofence_id)
                customer.traccar_id = geofence_id

        if geofence_id:
            vehicle_unique_ids = _get_org_vehicle_unique_ids(customer.organization_id)
            _link_geofence_to_devices(geofence_id, auth, base_url, vehicle_unique_ids)

        return {'status': 'success', 'geofence_id': geofence_id}
    except Exception as exc:
        print(f"Traccar customer geofence sync error: {exc}")
        return {'status': 'error', 'reason': str(exc)}

def sync_vehicle_geofence_permissions(vehicle):
    if not vehicle.organization_id or not vehicle.gps_device_id:
        return {'status': 'skipped', 'reason': 'missing_vehicle_data'}

    geofence_ids = set(
        Origin.objects.filter(organization_id=vehicle.organization_id, traccar_id__isnull=False)
        .values_list('traccar_id', flat=True)
    )
    geofence_ids.update(
        Customer.objects.filter(organization_id=vehicle.organization_id, traccar_id__isnull=False)
        .values_list('traccar_id', flat=True)
    )

    if not geofence_ids:
        return {'status': 'skipped', 'reason': 'no_geofences'}

    auth = _get_traccar_auth()
    base_url = _get_traccar_base_url()
    for geofence_id in geofence_ids:
        _link_geofence_to_devices(geofence_id, auth, base_url, [vehicle.gps_device_id])

    return {'status': 'success', 'geofences': len(geofence_ids)}

def sync_devices_from_traccar():
    """
    Queries Traccar API for all devices and updates local Vehicle records
    if Traccar has newer data than what we have locally.
    """
    url = f"{settings.TRACCAR_URL}/api/devices"
    auth = HTTPBasicAuth(settings.TRACCAR_USER, settings.TRACCAR_PASSWORD)
    
    try:
        response = requests.get(url, auth=auth, timeout=5)
        if response.status_code != 200:
            print(f"Traccar Sync Failed: {response.status_code}")
            return {'status': 'failed', 'reason': 'api_error'}
            
        traccar_devices = response.json()
        updated_count = 0
        
        for t_dev in traccar_devices:
            unique_id = t_dev.get('uniqueId')
            status = t_dev.get('status')
            last_update_str = t_dev.get('lastUpdate')
            
            if not unique_id or not last_update_str:
                continue
                
            try:
                vehicle = Vehicle.objects.get(gps_device_id=unique_id)
            except Vehicle.DoesNotExist:
                continue

            # Parse Traccar time (ISO 8601)
            traccar_time = parse_datetime(last_update_str)
            if not traccar_time:
                continue

            normalized_status = _normalize_status(status)
            status_changed = False
            if normalized_status != vehicle.device_status:
                vehicle.device_status = normalized_status
                vehicle.device_status_changed_at = traccar_time or timezone.now()
                DeviceLog.objects.create(
                    vehicle=vehicle,
                    status=normalized_status,
                    event_time=traccar_time or timezone.now(),
                    message=f"[SYNC] Device {vehicle.license_plate} now {normalized_status} (Traccar).",
                    payload={'source': 'celery_sync', 'deviceId': t_dev.get('id'), 'raw_status': status},
                )
                status_changed = True

            position_changed = False
            time_updated = False
            if not vehicle.last_gps_sync or traccar_time > vehicle.last_gps_sync:
                vehicle.last_gps_sync = traccar_time
                time_updated = True
                position_changed = _sync_position(vehicle, t_dev.get('positionId'), auth)
            
            if position_changed or status_changed or time_updated:
                vehicle.save()
                updated_count += 1
                
        return {'status': 'success', 'updated': updated_count}

    except Exception as e:
        print(f"Traccar Sync Error: {e}")
        return {'status': 'error', 'reason': str(e)}

def _sync_position(vehicle, position_id, auth):
    if not position_id:
        return False
        
    url = f"{settings.TRACCAR_URL}/api/positions?id={position_id}"
    try:
        resp = requests.get(url, auth=auth, timeout=5)
        if resp.status_code == 200:
            positions = resp.json()
            if positions:
                pos = positions[0]
                changed = False
                # Update Vehicle
                if 'latitude' in pos:
                    vehicle.last_latitude = pos.get('latitude', vehicle.last_latitude)
                    changed = True
                if 'longitude' in pos:
                    vehicle.last_longitude = pos.get('longitude', vehicle.last_longitude)
                    changed = True
                if 'course' in pos:
                    vehicle.last_heading = pos.get('course', vehicle.last_heading)
                    changed = True
                speed_knots = pos.get('speed', 0)
                vehicle.last_speed = speed_knots * 1.852 # Convert to km/h
                changed = True
                
                # Handle Attributes (Ignition, etc)
                attrs = pos.get('attributes', {})
                vehicle.last_ignition = attrs.get('ignition', vehicle.last_ignition)
                changed = True
                
                if 'totalDistance' in attrs:
                    vehicle.current_odometer = int(attrs['totalDistance'] / 1000)
                    changed = True
                
                # Handle Stop Logic
                now = timezone.now()
                if vehicle.last_speed <= STOP_SPEED_THRESHOLD:
                    if not vehicle.stopped_since:
                        vehicle.stopped_since = now # Approximate to now or pos time
                        changed = True
                else:
                    vehicle.stopped_since = None
                    changed = True
                    
                # Create History Record (optional, maybe too noisy for sync?)
                # VehiclePosition.objects.create(...) 
                return changed
        return False
                
    except Exception as e:
        print(f"Pos Sync Error: {e}")
        return False
