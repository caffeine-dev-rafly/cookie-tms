from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import VehicleViewSet, TripViewSet, GPSForwardView, DriverViewSet, CustomerViewSet, RouteViewSet

# Create the router
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'drivers', DriverViewSet, basename='driver') 
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'routes', RouteViewSet, basename='route')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # The Bridge for Traccar (This is the line you were missing or had wrong)
    path('api/forward-gps/', GPSForwardView.as_view(), name='gps-forward'),
]