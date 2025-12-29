from django.urls import path
from .views import TraccarWebhookView

urlpatterns = [
    path('traccar/webhook/', TraccarWebhookView.as_view(), name='traccar-webhook'),
]
