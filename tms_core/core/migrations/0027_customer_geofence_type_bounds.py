from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0026_customer_geofence_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='geofence_type',
            field=models.CharField(choices=[('CIRCLE', 'Circle'), ('RECTANGLE', 'Rectangle')], default='CIRCLE', max_length=20),
        ),
        migrations.AddField(
            model_name='customer',
            name='geofence_bounds',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
