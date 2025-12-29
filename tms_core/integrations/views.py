from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from core.models import Vehicle, VehicleEvent, ActivityLog, DeviceLog
from core.services.alerts import notify_vehicle_event
from django.utils.dateparse import parse_datetime
from django.utils import timezone

STATUS_MAP = {
    'deviceOnline': 'ONLINE',
    'deviceOffline': 'OFFLINE',
    'deviceUnknown': 'UNKNOWN',
}

class TraccarWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Optional simple token check
        expected_token = getattr(settings, 'TRACCAR_WEBHOOK_TOKEN', None)
        if expected_token:
            incoming = request.query_params.get('token')
            if incoming != expected_token:
                return Response({'status': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

        try:
            payload = request.data or {}
            event = payload.get('event') or payload
            device = payload.get('device') or {}

            traccar_id = device.get('uniqueId') or event.get('uniqueId')
            event_type = event.get('type') or payload.get('type')
            server_time = (
                event.get('eventTime')
                or event.get('serverTime')
                or payload.get('eventTime')
                or payload.get('serverTime')
            )
            
            if not traccar_id:
                return Response({'status': 'ignored', 'reason': 'no_device_id'}, status=status.HTTP_200_OK)

            try:
                vehicle = Vehicle.objects.get(gps_device_id=traccar_id)
            except Vehicle.DoesNotExist:
                return Response({'status': 'ignored', 'reason': 'unknown_vehicle'}, status=status.HTTP_200_OK)

            event_time = parse_datetime(server_time) if server_time else timezone.now()
            resolved_status = STATUS_MAP.get(event_type, 'UNKNOWN')

            # Handle Status Changes
            update_fields = []
            status_changed = resolved_status != vehicle.device_status

            if status_changed:
                vehicle.device_status = resolved_status
                vehicle.device_status_changed_at = event_time
                update_fields.extend(['device_status', 'device_status_changed_at'])

            if resolved_status == 'ONLINE':
                vehicle.last_gps_sync = event_time
                update_fields.append('last_gps_sync')

            if update_fields:
                vehicle.save(update_fields=update_fields)

            if status_changed:
                DeviceLog.objects.create(
                    vehicle=vehicle,
                    status=resolved_status,
                    event_time=event_time,
                    message=f"Device {vehicle.license_plate} went {resolved_status} at {event_time}.",
                    payload=payload,
                )

            if resolved_status == 'OFFLINE' and status_changed:
                self._handle_offline(vehicle, event_time)
            elif resolved_status == 'ONLINE' and status_changed:
                self._handle_online(vehicle, event_time)

            return Response({'status': 'processed'}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Webhook Error: {e}")
            return Response({'status': 'error'}, status=status.HTTP_400_BAD_REQUEST)

    def _handle_offline(self, vehicle, timestamp):
        # Create Event
        VehicleEvent.objects.create(
            vehicle=vehicle,
            event_type='OFFLINE',
            start_time=timestamp,
            end_time=timestamp, # Will be updated when online
            duration_minutes=0,
            latitude=vehicle.last_latitude,
            longitude=vehicle.last_longitude
        )
        
        # Log Activity
        ActivityLog.objects.create(
            user=None,
            action='VEHICLE_OFFLINE',
            details={'vehicle': vehicle.license_plate, 'id': vehicle.id, 'timestamp': str(timestamp)}
        )
        
        # Notify
        notify_vehicle_event(vehicle, 'VEHICLE_OFFLINE', timestamp, 0)

    def _handle_online(self, vehicle, timestamp):
        # Update Vehicle Sync
        vehicle.last_gps_sync = timestamp
        vehicle.save(update_fields=['last_gps_sync'])

        # Log Activity
        ActivityLog.objects.create(
            user=None,
            action='VEHICLE_ONLINE',
            details={'vehicle': vehicle.license_plate, 'id': vehicle.id, 'timestamp': str(timestamp)}
        )
