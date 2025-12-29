from decimal import Decimal
from datetime import timedelta, date as dt_date
from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Trip, Customer, Organization
from finance.models import Invoice
from finance.serializers import InvoiceSerializer, UnbilledTripSerializer


class FinanceAccessMixin:
    """
    Shared helpers for finance endpoints.
    """

    def _require_finance_access(self, request):
        user = request.user
        if not user.is_authenticated:
            return None, Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_superuser:
            org = None
            if request.query_params.get('organization'):
                org = get_object_or_404(Organization, pk=request.query_params.get('organization'))
            return org, None

        if user.role not in ['OWNER', 'FINANCE']:
            return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        if not user.organization:
            return None, Response({"detail": "Organization not set"}, status=status.HTTP_400_BAD_REQUEST)

        return user.organization, None

    def _parse_due_date(self, due_date_raw):
        if not due_date_raw:
            return None, Response({"error": "due_date is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            return dt_date.fromisoformat(due_date_raw), None
        except ValueError:
            return None, Response({"error": "Invalid due_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

    def _create_invoice_for_trips(self, *, org, customer, trip_ids, due_date, status_value='draft'):
        try:
            trip_ids = [int(tid) for tid in (trip_ids or [])]
        except (TypeError, ValueError):
            return None, Response({"error": "trip_ids must be a list of integers"}, status=status.HTTP_400_BAD_REQUEST)
        requested_ids = sorted(set(trip_ids))
        if not requested_ids:
            return None, Response({"error": "trip_ids[] is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            eligible_trips = Trip.objects.select_for_update().filter(
                id__in=requested_ids,
                customer=customer,
                status='COMPLETED',
                invoice__isnull=True,
            )
            if org:
                eligible_trips = eligible_trips.filter(organization=org)

            eligible_ids = set(eligible_trips.values_list('id', flat=True))
            missing_ids = [tid for tid in requested_ids if tid not in eligible_ids]
            if missing_ids:
                return None, Response(
                    {
                        "error": "Some trips are not eligible (must be completed, unbilled, and belong to the selected customer).",
                        "invalid_trip_ids": missing_ids,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total = eligible_trips.aggregate(total=Sum('price'))['total'] or Decimal('0')
            invoice = Invoice.objects.create(
                organization=org or customer.organization,
                customer=customer,
                status=status_value,
                due_date=due_date,
                total_amount=total,
            )
            eligible_trips.update(invoice=invoice)

        return invoice, None


class FinanceStatsView(FinanceAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org, error_response = self._require_finance_access(request)
        if error_response:
            return error_response

        trips = Trip.objects.filter(status='COMPLETED')
        invoices = Invoice.objects.all()
        if org:
            trips = trips.filter(organization=org)
            invoices = invoices.filter(organization=org)

        def trip_revenue(trip):
            return (trip.price or trip.revenue or Decimal('0'))

        total_revenue = sum([trip_revenue(t) for t in trips], Decimal('0'))
        total_expense = sum([(t.driver_cost or Decimal('0')) for t in trips], Decimal('0'))
        profit = total_revenue - total_expense

        unpaid_total = invoices.exclude(status='paid').aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        return Response(
            {
                "total_revenue": float(total_revenue),
                "total_expense": float(total_expense),
                "profit": float(profit),
                "unpaid_invoices": float(unpaid_total),
            }
        )

class UnbilledTripsView(FinanceAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org, error_response = self._require_finance_access(request)
        if error_response:
            return error_response

        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response({"error": "customer_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(Customer, pk=customer_id)
        if org and customer.organization_id != org.id:
            return Response({"error": "Customer does not belong to your organization."}, status=status.HTTP_400_BAD_REQUEST)

        trips = Trip.objects.filter(customer=customer, status='COMPLETED', invoice__isnull=True)
        if org:
            trips = trips.filter(organization=org)
        trips = trips.order_by('-completed_at', '-created_at')

        return Response(UnbilledTripSerializer(trips, many=True).data)


class InvoiceGenerateView(FinanceAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org, error_response = self._require_finance_access(request)
        if error_response:
            return error_response

        customer_id = request.data.get('customer_id')
        trip_ids = request.data.get('trip_ids') or []
        due_date = request.data.get('due_date')

        if not customer_id or not isinstance(trip_ids, list) or len(trip_ids) == 0:
            return Response({"error": "customer_id and trip_ids[] are required"}, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(Customer, pk=customer_id)
        if org and customer.organization_id != org.id:
            return Response({"error": "Customer does not belong to your organization."}, status=status.HTTP_400_BAD_REQUEST)

        parsed_due = None
        if due_date:
            try:
                parsed_due = dt_date.fromisoformat(due_date)
            except ValueError:
                return Response({"error": "Invalid due_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        parsed_due = parsed_due or (timezone.localdate() + timedelta(days=14))

        invoice, error = self._create_invoice_for_trips(
            org=org,
            customer=customer,
            trip_ids=trip_ids,
            due_date=parsed_due,
            status_value='draft',
        )
        if error:
            return error

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class InvoiceCreateView(FinanceAccessMixin, APIView):
    """
    POST /api/finance/invoices/create/
    Payload: { customer_id, trip_ids[], due_date }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org, error_response = self._require_finance_access(request)
        if error_response:
            return error_response

        customer_id = request.data.get('customer_id')
        trip_ids = request.data.get('trip_ids') or []
        due_date_raw = request.data.get('due_date')

        if not customer_id or not isinstance(trip_ids, list) or len(trip_ids) == 0:
            return Response({"error": "customer_id and trip_ids[] are required"}, status=status.HTTP_400_BAD_REQUEST)

        due_date, date_error = self._parse_due_date(due_date_raw)
        if date_error:
            return date_error

        customer = get_object_or_404(Customer, pk=customer_id)
        if org and customer.organization_id != org.id:
            return Response({"error": "Customer does not belong to your organization."}, status=status.HTTP_400_BAD_REQUEST)

        invoice, error = self._create_invoice_for_trips(
            org=org,
            customer=customer,
            trip_ids=trip_ids,
            due_date=due_date,
            status_value='draft',
        )
        if error:
            return error

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class InvoiceMarkPaidView(FinanceAccessMixin, APIView):
    """
    POST /api/finance/invoices/{id}/mark-paid/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        org, error_response = self._require_finance_access(request)
        if error_response:
            return error_response

        invoice = get_object_or_404(Invoice, pk=id)
        if org and invoice.organization_id != org.id:
            return Response({"error": "Invoice does not belong to your organization."}, status=status.HTTP_400_BAD_REQUEST)

        invoice.status = 'paid'
        invoice.save(update_fields=['status'])
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_200_OK)


class InvoiceListView(FinanceAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org, error_response = self._require_finance_access(request)
        if error_response:
            return error_response

        invoices = Invoice.objects.all().select_related('customer')
        if org:
            invoices = invoices.filter(organization=org)

        invoices = invoices.order_by('-created_at')
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
