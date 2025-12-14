from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta, time
from django.utils import timezone

from .models import Vehicle, Trip, Customer, Route, User, VehiclePosition, Organization, DeliveryProof
from .serializers import (
    VehicleSerializer, TripSerializer, UserSerializer, CustomerSerializer, 
    RouteSerializer, VehiclePositionSerializer, SuratJalanHistorySerializer, generate_surat_number,
    OrganizationSerializer
)

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
        return Response(TripSerializer(trip).data, status=status.HTTP_200_OK)

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Customer.objects.all()

class RouteViewSet(viewsets.ModelViewSet):
    serializer_class = RouteSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Route.objects.all()

class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Organization.objects.all()

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()

class DriverViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='DRIVER')
    serializer_class = UserSerializer 
    permission_classes = [permissions.AllowAny]

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

            return Response({"status": "Updated"}, status=status.HTTP_200_OK)
            
        except Vehicle.DoesNotExist:
            print(f"⚠️ Unknown Device: {traccar_id}")
            return Response({"status": "Ignored"}, status=status.HTTP_200_OK)
