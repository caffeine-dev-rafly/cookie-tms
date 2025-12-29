from rest_framework import serializers
from core.models import Trip
from finance.models import Invoice


class UnbilledTripSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    route = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id',
            'date',
            'route',
            'price',
        ]

    def get_date(self, obj):
        dt = obj.completed_at or obj.created_at
        if not dt:
            return None
        return dt.date().isoformat()

    def get_route(self, obj):
        origin = obj.origin or ''
        destination = obj.destination or ''
        if origin and destination:
            return f"{origin} -> {destination}"
        return destination or origin or '-'


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    trips = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id',
            'invoice_number',
            'customer',
            'customer_name',
            'trips',
            'total_amount',
            'status',
            'due_date',
            'created_at',
        ]
        read_only_fields = ['total_amount', 'created_at']

    def get_trips(self, obj):
        # Preserve the existing API shape (list of trip IDs) while using the FK relation.
        return list(obj.trip_set.values_list('id', flat=True))
