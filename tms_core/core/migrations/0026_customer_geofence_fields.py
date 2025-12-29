from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0025_origin_geofence_fields_trip_arrived'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='traccar_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='radius',
            field=models.IntegerField(default=200),
        ),
    ]
