from django.urls import path
from .views import DockerContainerListView

urlpatterns = [
    path('docker/containers/', DockerContainerListView.as_view(), name='docker-containers'),
]
