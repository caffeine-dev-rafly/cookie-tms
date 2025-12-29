from django.urls import path
from finance.views import (
    FinanceStatsView,
    InvoiceGenerateView,
    InvoiceListView,
    UnbilledTripsView,
    InvoiceCreateView,
    InvoiceMarkPaidView,
)

urlpatterns = [
    path('stats/', FinanceStatsView.as_view(), name='finance_stats'),
    path('unbilled/', UnbilledTripsView.as_view(), name='finance_unbilled_trips'),
    path('invoices/create/', InvoiceCreateView.as_view(), name='invoice_create'),
    path('invoices/generate/', InvoiceGenerateView.as_view(), name='invoice_generate'),
    path('invoices/<int:id>/mark-paid/', InvoiceMarkPaidView.as_view(), name='invoice_mark_paid'),
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
]
