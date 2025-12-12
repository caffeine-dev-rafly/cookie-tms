from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Vehicle, Trip
from .serializers import VehicleSerializer, TripSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    # SECURITY FILTER: Only return vehicles belonging to the user's organization
    def get_queryset(self):
        user = self.request.user
        if user.is_staff: # Admin sees all
            return Vehicle.objects.all()
        return Vehicle.objects.filter(organization=user.organization)

    # AUTO-ASSIGN: When creating a vehicle, auto-link it to user's organization
    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Trip.objects.all()
        return Trip.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


# THE BRIDGE (Traccar -> Django)
class GPSForwardView(APIView):
    permission_classes = [] 

    # Handle GET requests (Browser test or Traccar check)
    def get(self, request):
        return Response({"status": "Ready for data"}, status=status.HTTP_200_OK)

    # Handle POST requests (Real GPS Data)
    def post(self, request):
        data = request.data
        device_data = data.get('device', {})
        position_data = data.get('position', {})
        
        if not device_data:
            return Response({"error": "No device data"}, status=status.HTTP_400_BAD_REQUEST)

        traccar_id = device_data.get('uniqueId')
        lat = position_data.get('latitude')
        lon = position_data.get('longitude')
        
        print(f"📡 GPS SIGNAL RECEIVED: {traccar_id} -> {lat}, {lon}")

        try:
            vehicle = Vehicle.objects.get(gps_device_id=traccar_id)
            return Response({"status": "Updated"}, status=status.HTTP_200_OK)
        except Vehicle.DoesNotExist:
            print(f"⚠️ Unknown Device: {traccar_id}")
            return Response({"status": "Ignored"}, status=status.HTTP_200_OK)