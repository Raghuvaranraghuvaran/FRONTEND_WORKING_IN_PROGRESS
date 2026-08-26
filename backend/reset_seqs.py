import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection

tables = [
    "orders_order",
    "orders_orderitem",
    "returns_returnrequest",
    "returns_returnline",
    "payments_payment",
    "invoices_invoice",
    "accounts_user",
    "catalog_category",
    "catalog_product",
]

with connection.cursor() as cursor:
    for table in tables:
        try:
            cursor.execute(f"SELECT COALESCE(MAX(id), 1) + 1 FROM {table};")
            next_id = cursor.fetchone()[0]
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), {next_id}, false);")
            print(f"Table {table}: sequence set to {next_id}")
        except Exception as e:
            print(f"Table {table} skipped or error: {e}")

print("All PostgreSQL sequences reset successfully!")
