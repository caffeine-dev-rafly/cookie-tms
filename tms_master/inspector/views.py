from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
import docker

class DockerContainerListView(APIView):
    permission_classes = [permissions.AllowAny] # Or IsAdminUser

    def get(self, request):
        try:
            client = docker.from_env()
            containers = client.containers.list()
            data = []
            for c in containers:
                # Basic stats might be slow to fetch for all, so just basic info first
                data.append({
                    'id': c.short_id,
                    'name': c.name,
                    'status': c.status,
                    'image': str(c.image),
                    # 'stats': c.stats(stream=False) # Uncomment if performance allows
                })
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)