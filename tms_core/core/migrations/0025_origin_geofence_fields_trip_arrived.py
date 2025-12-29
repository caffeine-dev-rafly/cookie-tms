from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0024_origin_trip_customers_origin_location'),
    ]

    operations = [
        migrations.AddField(
            model_name='origin',
            name='traccar_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='origin',
            name='radius',
            field=models.IntegerField(default=200),
        ),
        migrations.AddField(
            model_name='origin',
            name='is_origin',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='trip',
            name='status',
            field=models.CharField(
                choices=[
                    ('PLANNED', 'Planned'),
                    ('ARRIVED', 'Arrived'),
                    ('OTW', 'On The Way'),
                    ('COMPLETED', 'Completed'),
                    ('CANCELLED', 'Cancelled'),
                    ('SETTLED', 'Settled'),
                ],
                default='PLANNED',
                max_length=20,
            ),
        ),
    ]
