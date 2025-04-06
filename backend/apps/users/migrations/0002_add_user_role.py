from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'Admin'),
                    ('company', 'Company User'),
                    ('employee', 'Employee')
                ],
                default='employee',
                max_length=20
            ),
        ),
    ] 