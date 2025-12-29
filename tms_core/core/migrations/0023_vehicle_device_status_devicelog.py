from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_vehicleevent'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='device_status',
            field=models.CharField(choices=[('ONLINE', 'Online'), ('OFFLINE', 'Offline'), ('UNKNOWN', 'Unknown')], default='UNKNOWN', max_length=20),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='device_status_changed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='DeviceLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('ONLINE', 'Online'), ('OFFLINE', 'Offline'), ('UNKNOWN', 'Unknown')], max_length=20)),
                ('message', models.TextField(blank=True)),
                ('event_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('vehicle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='device_logs', to='core.vehicle')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
