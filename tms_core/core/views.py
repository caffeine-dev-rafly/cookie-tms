from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.utils.dateparse import parse_date, parse_datetime
from django.db.models import Q
from datetime import datetime, timedelta, time
from django.utils import timezone
from decimal import Decimal, InvalidOperation

from .models import Vehicle, Trip, Customer, Route, Origin, User, VehiclePosition, Organization, DeliveryProof, Notification, ActivityLog, VehicleEvent
from .serializers import (
    VehicleSerializer, TripSerializer, UserSerializer, CustomerSerializer, 
    RouteSerializer, OriginSerializer, VehiclePositionSerializer, SuratJalanHistorySerializer, generate_surat_number,
    OrganizationSerializer, NotificationSerializer, ActivityLogSerializer
)
from .services.alerts import (
    STOP_SPEED_THRESHOLD,
    DEFAULT_OFFLINE_MINUTES,
    DEFAULT_STOP_MINUTES,
    notify_vehicle_event,
)
from .services.traccar import sync_devices_from_traccar

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.pk,
                'username': user.username,
                'role': user.role, # Assumes 'role' field exists on User model
                'is_superuser': user.is_superuser,
                'email': user.email
            }
        })

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
            return Vehicle.objects.all()

    @action(detail=False, methods=['post'], url_path='sync', permission_classes=[permissions.IsAuthenticated])
    def sync(self, request):
        """
        Force a check against Traccar API to ensure data is latest.
        """
        result = sync_devices_from_traccar()
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='alerts', permission_classes=[permissions.IsAuthenticated])
    def alerts(self, request):
        user = request.user
        if not user.organization_id:
            return Response([], status=status.HTTP_200_OK)
        if not user.is_superuser and user.role not in ['OWNER', 'ADMIN']:
            return Response([], status=status.HTTP_200_OK)

        now = timezone.now()
        stop_threshold = user.stop_alert_minutes or DEFAULT_STOP_MINUTES
        offline_threshold = user.offline_alert_minutes or DEFAULT_OFFLINE_MINUTES
        alerts = []

        vehicles = Vehicle.objects.filter(organization=user.organization)
        for vehicle in vehicles:
            # Determine effective stopped_since
            effective_stopped_since = vehicle.stopped_since
            
            # Fallback: If stopped_since is None but vehicle is clearly stopped based on last data
            if not effective_stopped_since and vehicle.last_speed <= STOP_SPEED_THRESHOLD and vehicle.last_gps_sync:
                 effective_stopped_since = vehicle.last_gps_sync
                 # Auto-heal the record
                 vehicle.stopped_since = effective_stopped_since
                 vehicle.save(update_fields=['stopped_since'])

            if effective_stopped_since:
                stop_minutes = (now - effective_stopped_since).total_seconds() / 60
                if stop_minutes >= stop_threshold:
                    alerts.append({
                        "vehicle_id": vehicle.id,
                        "license_plate": vehicle.license_plate,
                        "type": "STOPPED",
                        "since": effective_stopped_since,
                        "duration_minutes": round(stop_minutes, 1),
                        "speed": vehicle.last_speed,
                        "last_latitude": vehicle.last_latitude,
                        "last_longitude": vehicle.last_longitude,
                    })
                    notify_vehicle_event(vehicle, 'VEHICLE_STOP', effective_stopped_since, stop_minutes)

            last_sync = vehicle.last_gps_sync
            if vehicle.gps_device_id and last_sync:
                offline_minutes = (now - last_sync).total_seconds() / 60
                if offline_minutes >= offline_threshold:
                    alerts.append({
                        "vehicle_id": vehicle.id,
                        "license_plate": vehicle.license_plate,
                        "type": "OFFLINE",
                        "since": last_sync,
                        "duration_minutes": round(offline_minutes, 1),
                        "speed": vehicle.last_speed,
                        "last_latitude": vehicle.last_latitude,
                        "last_longitude": vehicle.last_longitude,
                    })
                    notify_vehicle_event(vehicle, 'VEHICLE_OFFLINE', last_sync, offline_minutes)

        return Response(alerts, status=status.HTTP_200_OK)

    # ACTION: Get History for Playback
    # GET /api/vehicles/1/history/?date=2025-12-13
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        vehicle = self.get_object()
        date_str = request.query_params.get('date')
        
        if not date_str:
            # Default to today
            query_date = timezone.now().date()
        else:
            query_date = parse_date(date_str)

        if not query_date:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)

        # Filter positions by date range (00:00 to 23:59)
        start_of_day = datetime.combine(query_date, time.min)
        end_of_day = datetime.combine(query_date, time.max)
        
        # Make it timezone aware if needed (assuming UTC for simplicity in this prototype)
        # In production, handle timezones carefully!
        
        positions = VehiclePosition.objects.filter(
            vehicle=vehicle,
            timestamp__range=(start_of_day, end_of_day)
        ).order_by('timestamp')

        serializer = VehiclePositionSerializer(positions, many=True)
        return Response(serializer.data)


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Trip.objects.all()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], url_path='next-surat-number')
    def next_surat_number(self, request):
        """
        Provide the next Surat Jalan number so the frontend can prefill while keeping numbers unique.
        """
        return Response({'next_surat_jalan_number': generate_surat_number()})

    @action(detail=True, methods=['get'], url_path='surat-history')
    def surat_history(self, request, pk=None):
        trip = self.get_object()
        history = trip.surat_histories.all()
        serializer = SuratJalanHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='arrive')
    def mark_arrival(self, request, pk=None):
        """
        Mark a destination as arrived. Create DeliveryProof. 
        If all destinations are done, auto-complete the trip.
        """
        trip = self.get_object()
        previous_status = trip.status
        destination = request.data.get('destination')
        proof_file = request.FILES.get('proof_of_delivery')
        lat = request.data.get('last_latitude')
        lon = request.data.get('last_longitude')

        if not destination:
            return Response({"error": "destination is required"}, status=status.HTTP_400_BAD_REQUEST)

        destinations = trip.destinations or ([trip.destination] if trip.destination else [])
        if destination not in destinations:
            return Response({"error": "Destination not part of this trip"}, status=status.HTTP_400_BAD_REQUEST)

        # Create Delivery Proof
        if proof_file:
            DeliveryProof.objects.create(
                trip=trip,
                destination=destination,
                proof_of_delivery=proof_file,
                latitude=float(lat) if lat else None,
                longitude=float(lon) if lon else None
            )

        completed = trip.completed_destinations or []
        if destination not in completed:
            completed.append(destination)
        trip.completed_destinations = completed

        if trip.status == 'PLANNED':
            trip.status = 'OTW'

        # Check for full completion
        # Use set comparison for accuracy
        all_dests = set(destinations)
        completed_set = set(completed)
        
        if completed_set.issuperset(all_dests):
            trip.status = 'COMPLETED'
            trip.completed_at = timezone.now()

        trip.save()

        if previous_status != 'COMPLETED' and trip.status == 'COMPLETED':
            self._notify_trip_completed(trip)

        return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='settle')
    def settle_trip(self, request, pk=None):
        """
        Final settlement after driver returns to pool.
        """
        trip = self.get_object()
        if trip.status != 'COMPLETED':
            return Response({"error": "Trip must be completed before settlement."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receipts = request.data.get('actual_expenses')
            cash_returned = request.data.get('cash_returned')
            driver_commission = request.data.get('driver_commission')
            final_odometer = request.data.get('final_odometer', None)

            receipts_val = Decimal(str(receipts))
            cash_returned_val = Decimal(str(cash_returned)) if cash_returned is not None else Decimal('0')
            commission_val = Decimal(str(driver_commission)) if driver_commission is not None else Decimal('0')
            final_odometer_val = int(final_odometer) if final_odometer not in [None, ''] else trip.final_odometer
        except (TypeError, ValueError, InvalidOperation):
            return Response({"error": "Invalid settlement values."}, status=status.HTTP_400_BAD_REQUEST)

        if receipts_val < 0 or cash_returned_val < 0 or commission_val < 0:
            return Response({"error": "Amounts cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        trip.actual_expenses = receipts_val
        trip.cash_returned = cash_returned_val
        trip.driver_commission = commission_val
        trip.final_odometer = final_odometer_val
        trip.status = 'SETTLED'
        trip.save()

        return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)

    def _notify_trip_completed(self, trip):
        org_users = User.objects.filter(organization=trip.organization, role__in=['OWNER', 'ADMIN'])
        message = f"Trip {trip.surat_jalan_number or trip.id} completed."
        for u in org_users:
            Notification.objects.create(user=u, message=message)

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Customer.objects.all()

class RouteViewSet(viewsets.ModelViewSet):
    serializer_class = RouteSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Route.objects.all()

class OriginViewSet(viewsets.ModelViewSet):
    serializer_class = OriginSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Origin.objects.all()

class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Organization.objects.all()

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()

    def perform_create(self, serializer):
        serializer.save()

class DriverViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='DRIVER')
    serializer_class = UserSerializer 
    permission_classes = [permissions.AllowAny]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        notif_id = request.data.get('id')
        qs = Notification.objects.filter(user=request.user)
        if notif_id:
            qs = qs.filter(id=notif_id)
        updated = qs.update(is_read=True)
        return Response({"updated": updated}, status=status.HTTP_200_OK)

# THE BRIDGE (Traccar -> Django)
class GPSForwardView(APIView):
    permission_classes = [] 

    # Handle GET requests (Browser test or Traccar check)
    def get(self, request):
        traccar_id = request.query_params.get('id')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        course = request.query_params.get('course') 
        speed = request.query_params.get('speed') # Knots usually
        
        if traccar_id and lat and lon:
            try:
                vehicle = Vehicle.objects.get(gps_device_id=traccar_id)
                vehicle.last_latitude = float(lat)
                vehicle.last_longitude = float(lon)
                
                heading_val = 0.0
                if course:
                    heading_val = float(course)
                    vehicle.last_heading = heading_val
                
                speed_val = 0.0
                if speed:
                    speed_val = float(speed) * 1.852
                    vehicle.last_speed = speed_val
 
                now = timezone.now()
                if speed_val <= STOP_SPEED_THRESHOLD:
                    if not vehicle.stopped_since:
                        vehicle.stopped_since = now
                else:
                    if vehicle.stopped_since:
                        # EVENT: STOP ENDED
                        duration = (now - vehicle.stopped_since).total_seconds() / 60.0
                        if duration >= 1: # Minimum 1 minute stop
                            VehicleEvent.objects.create(
                                vehicle=vehicle,
                                event_type='STOP',
                                start_time=vehicle.stopped_since,
                                end_time=now,
                                duration_minutes=round(duration, 2),
                                latitude=vehicle.last_latitude,
                                longitude=vehicle.last_longitude
                            )
                    vehicle.stopped_since = None

                vehicle.last_gps_sync = now
                if vehicle.device_status != 'ONLINE':
                    vehicle.device_status = 'ONLINE'
                    vehicle.device_status_changed_at = now
                vehicle.save()

                # SAVE HISTORY
                VehiclePosition.objects.create(
                    vehicle=vehicle,
                    latitude=float(lat),
                    longitude=float(lon),
                    speed=speed_val,
                    heading=heading_val,
                    ignition=vehicle.last_ignition # Assume unchanged for GET
                )

                if vehicle.stopped_since:
                    stop_minutes = (now - vehicle.stopped_since).total_seconds() / 60
                    notify_vehicle_event(vehicle, 'VEHICLE_STOP', vehicle.stopped_since, stop_minutes)

                return Response({"status": "Updated"}, status=status.HTTP_200_OK)
            except Vehicle.DoesNotExist:
                return Response({"status": "Ignored"}, status=status.HTTP_200_OK)
        
        return Response({"status": "Ready"}, status=status.HTTP_200_OK)
    

    # Handle POST requests (Real GPS Data - Traccar Webhook)
    def post(self, request):
        data = request.data
        device_data = data.get('device', {})
        position_data = data.get('position', {})
        
        if not device_data:
            traccar_id = data.get('uniqueId')
            lat = data.get('latitude')
            lon = data.get('longitude')
            speed = data.get('speed')
            attributes = data.get('attributes', {})
            course = data.get('course')
        else:
            traccar_id = device_data.get('uniqueId')
            lat = position_data.get('latitude')
            lon = position_data.get('longitude')
            speed = position_data.get('speed') # Knots
            course = position_data.get('course')
            attributes = position_data.get('attributes', {})

        if not traccar_id:
             return Response({"error": "No device ID"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vehicle = Vehicle.objects.get(gps_device_id=traccar_id)
            
            # Prepare values
            lat_val = float(lat) if lat else vehicle.last_latitude
            lon_val = float(lon) if lon else vehicle.last_longitude
            speed_val = (float(speed) * 1.852) if speed is not None else vehicle.last_speed
            heading_val = float(course) if course is not None else vehicle.last_heading
            ignition_val = attributes.get('ignition', vehicle.last_ignition)

            # Update Vehicle State
            if lat and lon:
                vehicle.last_latitude = lat_val
                vehicle.last_longitude = lon_val
            
            vehicle.last_speed = speed_val
            vehicle.last_heading = heading_val
            vehicle.last_ignition = ignition_val
            
            now = timezone.now()
            
            # 1. OFFLINE CHECK
            if vehicle.last_gps_sync:
                offline_duration = (now - vehicle.last_gps_sync).total_seconds() / 60.0
                offline_threshold = vehicle.user.offline_alert_minutes if (hasattr(vehicle, 'user') and vehicle.user) else DEFAULT_OFFLINE_MINUTES
                
                # Check user config or fallback to Organization OWNER config if available, else Default
                # Assuming vehicle.organization -> get owner
                if not hasattr(vehicle, 'user') or not vehicle.user:
                     org_owner = User.objects.filter(organization=vehicle.organization, role='OWNER').first()
                     if org_owner:
                         offline_threshold = org_owner.offline_alert_minutes
                
                if offline_duration >= offline_threshold:
                     VehicleEvent.objects.create(
                        vehicle=vehicle,
                        event_type='OFFLINE',
                        start_time=vehicle.last_gps_sync,
                        end_time=now,
                        duration_minutes=round(offline_duration, 2),
                        latitude=vehicle.last_latitude,
                        longitude=vehicle.last_longitude
                     )

            # 2. STOP CHECK
            if speed_val <= STOP_SPEED_THRESHOLD:
                if not vehicle.stopped_since:
                    vehicle.stopped_since = now
            else:
                if vehicle.stopped_since:
                    duration = (now - vehicle.stopped_since).total_seconds() / 60.0
                    if duration >= 1:
                        VehicleEvent.objects.create(
                            vehicle=vehicle,
                            event_type='STOP',
                            start_time=vehicle.stopped_since,
                            end_time=now,
                            duration_minutes=round(duration, 2),
                            latitude=vehicle.last_latitude,
                            longitude=vehicle.last_longitude
                        )
                vehicle.stopped_since = None
            
            vehicle.last_gps_sync = now
            if vehicle.device_status != 'ONLINE':
                vehicle.device_status = 'ONLINE'
                vehicle.device_status_changed_at = now
            
            if 'totalDistance' in attributes:
                vehicle.current_odometer = int(attributes['totalDistance'] / 1000)

            vehicle.save() 
            
            # SAVE HISTORY
            if lat and lon:
                VehiclePosition.objects.create(
                    vehicle=vehicle,
                    latitude=lat_val,
                    longitude=lon_val,
                    speed=speed_val,
                    heading=heading_val,
                    ignition=ignition_val
                )

            if vehicle.stopped_since:
                stop_minutes = (now - vehicle.stopped_since).total_seconds() / 60
                notify_vehicle_event(vehicle, 'VEHICLE_STOP', vehicle.stopped_since, stop_minutes)

            return Response({"status": "Updated"}, status=status.HTTP_200_OK)
            
        except Vehicle.DoesNotExist:
            print(f"⚠️ Unknown Device: {traccar_id}")
            return Response({"status": "Ignored"}, status=status.HTTP_200_OK)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ActivityLog.objects.all()
        if not user.is_authenticated or not user.organization_id:
            return ActivityLog.objects.none()
        if user.role in ['OWNER', 'ADMIN']:
            return ActivityLog.objects.filter(
                Q(user__organization=user.organization) |
                Q(details__organization_id=user.organization_id)
            )
        return ActivityLog.objects.none()

class TraccarEventView(APIView):
    permission_classes = [] # Allow internal calls

    def post(self, request):
        try:
            event = request.data.get('event', {})
            device = request.data.get('device', {})
            
            if not event or not device:
                return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

            traccar_id = device.get('uniqueId')
            event_type = event.get('type')
            server_time = event.get('eventTime') or event.get('serverTime') # Traccar timestamp
            event_time = parse_datetime(server_time) if server_time else None
            if not event_time:
                event_time = timezone.now()

            if not traccar_id:
                 return Response({'status': 'no device id'}, status=status.HTTP_200_OK)

            try:
                vehicle = Vehicle.objects.get(gps_device_id=traccar_id)
            except Vehicle.DoesNotExist:
                return Response({'status': 'unknown vehicle'}, status=status.HTTP_200_OK)

            # Handle OFFLINE
            if event_type == 'deviceOffline':
                vehicle.device_status = 'OFFLINE'
                vehicle.device_status_changed_at = event_time
                vehicle.save(update_fields=['device_status', 'device_status_changed_at'])
                # Create Event Record
                VehicleEvent.objects.create(
                    vehicle=vehicle,
                    event_type='OFFLINE',
                    start_time=event_time, # Approximate start
                    end_time=event_time, # Placeholder
                    duration_minutes=0, # Unknown yet
                    latitude=vehicle.last_latitude,
                    longitude=vehicle.last_longitude
                )
                
                # Log Activity
                ActivityLog.objects.create(
                    action='VEHICLE_OFFLINE',
                    details={
                        'organization_id': vehicle.organization_id,
                        'vehicle': vehicle.license_plate,
                        'vehicle_id': vehicle.id,
                        'event_time': event_time.isoformat(),
                    },
                    user=None # System
                )
                
                # Notify User
                notify_vehicle_event(vehicle, 'VEHICLE_OFFLINE', timezone.now(), 0)

            # Handle ONLINE
            elif event_type == 'deviceOnline':
                vehicle.device_status = 'ONLINE'
                vehicle.device_status_changed_at = event_time
                vehicle.save(update_fields=['device_status', 'device_status_changed_at'])
                # Log Activity
                ActivityLog.objects.create(
                    action='VEHICLE_ONLINE',
                    details={
                        'organization_id': vehicle.organization_id,
                        'vehicle': vehicle.license_plate,
                        'vehicle_id': vehicle.id,
                        'event_time': event_time.isoformat(),
                    },
                    user=None
                )
                
                # Close any open OFFLINE events? 
                # (Complex logic omitted for simplicity, but we log the return)
            # Handle GEOFENCE ENTER/EXIT (Notifications + optional auto-arrival)
            elif event_type in ['geofenceEnter', 'geofenceExit']:
                geofence_id = event.get('geofenceId')
                if not geofence_id:
                    return Response({'status': 'ignored', 'reason': 'no_geofence_id'}, status=status.HTTP_200_OK)

                origin = Origin.objects.filter(traccar_id=geofence_id).first()
                customer = None
                geofence_type = None
                geofence_name = None
                geofence_ref_id = None

                if origin:
                    geofence_type = 'origin' if origin.is_origin else 'drop'
                    geofence_name = origin.name
                    geofence_ref_id = origin.id
                else:
                    customer = Customer.objects.filter(traccar_id=geofence_id).first()
                    if customer:
                        geofence_type = 'customer'
                        geofence_name = customer.name
                        geofence_ref_id = customer.id

                if not geofence_type:
                    return Response({'status': 'ignored', 'reason': 'unknown_geofence'}, status=status.HTTP_200_OK)

                action_label = 'entered' if event_type == 'geofenceEnter' else 'exited'
                category = 'GEOFENCE_ENTER' if event_type == 'geofenceEnter' else 'GEOFENCE_EXIT'
                geofence_label = geofence_type.capitalize()
                message = f"Vehicle {vehicle.license_plate} {action_label} {geofence_label} geofence {geofence_name}."
                event_key = event.get('id') or int(event_time.timestamp())
                alert_key = f"{category}:{vehicle.id}:{geofence_id}:{event_key}"
                watchers = User.objects.filter(
                    organization=vehicle.organization,
                    role__in=['OWNER', 'ADMIN'],
                )

                for watcher in watchers:
                    if Notification.objects.filter(user=watcher, alert_key=alert_key).exists():
                        continue
                    Notification.objects.create(
                        user=watcher,
                        message=message,
                        category=category,
                        reference_id=str(geofence_id),
                        alert_key=alert_key,
                    )

                ActivityLog.objects.create(
                    action=category,
                    details={
                        'organization_id': vehicle.organization_id,
                        'vehicle_id': vehicle.id,
                        'vehicle': vehicle.license_plate,
                        'geofence_id': geofence_id,
                        'geofence_ref_id': geofence_ref_id,
                        'geofence_name': geofence_name,
                        'geofence_type': geofence_type,
                        'event_time': event_time.isoformat(),
                    },
                    user=None,
                    ip_address=request.META.get('REMOTE_ADDR')
                )

                if event_type == 'geofenceEnter' and origin and origin.is_origin:
                    active_statuses = ['PLANNED', 'OTW']
                    trip = Trip.objects.filter(
                        vehicle=vehicle,
                        status__in=active_statuses,
                        origin_location=origin
                    ).order_by('created_at').first()

                    if trip:
                        previous_status = trip.status
                        if previous_status != 'ARRIVED':
                            trip.status = 'ARRIVED'
                            trip.save(update_fields=['status'])

                        ActivityLog.objects.create(
                            action='TRIP_ARRIVED_AUTO',
                            details={
                                'organization_id': vehicle.organization_id,
                                'trip_id': trip.id,
                                'vehicle': vehicle.license_plate,
                                'origin': origin.name,
                                'previous_status': previous_status,
                                'message': f"Auto-detected arrival at {origin.name}",
                            },
                            user=None,
                            ip_address=request.META.get('REMOTE_ADDR')
                        )
                
            return Response({'status': 'processed'}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Traccar Event Error: {e}")
            return Response({'status': 'error'}, status=status.HTTP_400_BAD_REQUEST)
