from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    VehicleViewSet, TripViewSet, GPSForwardView, DriverViewSet, 
    CustomerViewSet, RouteViewSet, OrganizationViewSet, UserViewSet
)
from core.api.views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
# Create the router
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'drivers', DriverViewSet, basename='driver') 
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # JWT Auth
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # The Bridge for Traccar
    path('api/forward-gps/', GPSForwardView.as_view(), name='gps-forward'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)