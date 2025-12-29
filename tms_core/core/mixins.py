from .models import ActivityLog

class LoggingMixin:
    def log_activity(self, action, details=None):
        user = self.request.user if self.request.user.is_authenticated else None
        # details can be a dict
        ActivityLog.objects.create(
            user=user,
            action=action,
            details=details or {},
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        model_name = instance._meta.model_name.upper()
        self.log_activity(f'{model_name}_CREATED', {'id': instance.id, 'str': str(instance)})

    def perform_update(self, serializer):
        instance = serializer.save()
        model_name = instance._meta.model_name.upper()
        self.log_activity(f'{model_name}_UPDATED', {'id': instance.id, 'str': str(instance)})

    def perform_destroy(self, instance):
        model_name = instance._meta.model_name.upper()
        details = {'id': instance.id, 'str': str(instance)}
        instance.delete()
        self.log_activity(f'{model_name}_DELETED', details)
