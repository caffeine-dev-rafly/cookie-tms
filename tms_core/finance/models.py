from django.db import models
from django.utils import timezone

from core.models import Customer, Organization


class Invoice(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=20, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return self.invoice_number or f"Invoice #{self.id}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_invoice_number(cls, for_date=None):
        """
        Format: INV-YYYY### (e.g., INV-2025001).
        """
        invoice_date = for_date or timezone.localdate()
        prefix = f"INV-{invoice_date.year}"

        last_invoice = (
            cls.objects.filter(invoice_number__startswith=prefix)
            .order_by('-created_at', '-id')
            .first()
        )
        next_seq = 1
        if last_invoice and last_invoice.invoice_number:
            suffix = last_invoice.invoice_number.replace(prefix, '')
            if suffix.isdigit():
                next_seq = int(suffix) + 1

        return f"{prefix}{next_seq:03d}"
