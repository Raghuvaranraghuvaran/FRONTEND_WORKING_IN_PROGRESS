"""
Management command: reseed_categories

Fixes categories that were created with the old `cat_<merchant_pk>_<slug>` ID
format and replaces them with stable `cat_<slug>` IDs.

Safe to run multiple times (idempotent). Products linked to old category IDs
are automatically re-pointed to the new ones before the old records are removed.

Usage:
    python manage.py reseed_categories
    python manage.py reseed_categories --dry-run   # preview without saving
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from catalog.models import Category, Product
from merchants.models import Merchant


# Canonical default categories used by the app.
DEFAULT_CATEGORIES = [
    ("cat_ethnic", "Ethnic Wear", "Kurtas, sarees, lehengas and festive wear"),
    ("cat_daily", "Daily Wear", "Everyday tops, shirts and basics"),
    ("cat_electronics", "Electronics", "Gadgets and accessories"),
    ("cat_home", "Home", "Home and living essentials"),
]


class Command(BaseCommand):
    help = "Re-seed merchant categories with stable slug-based IDs, migrating any old PK-based IDs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without writing to the database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved.\n"))

        merchants = Merchant.objects.all()
        if not merchants.exists():
            self.stdout.write(self.style.ERROR("No merchants found. Run seed_demo first."))
            return

        for merchant in merchants:
            self.stdout.write(f"\nMerchant: {merchant.business_name} (pk={merchant.pk})")
            self._fix_merchant_categories(merchant, dry_run)

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDry run complete — nothing was saved."))
            # Roll back the transaction so nothing persists.
            transaction.set_rollback(True)
        else:
            self.stdout.write(self.style.SUCCESS("\nAll categories re-seeded successfully."))

    def _fix_merchant_categories(self, merchant, dry_run):
        existing = {c.id: c for c in Category.objects.filter(merchant=merchant)}

        for canonical_id, name, description in DEFAULT_CATEGORIES:
            slug = slugify(name)
            old_style_id = f"cat_{merchant.pk}_{slug}"

            # --- Already has canonical ID ---
            if canonical_id in existing:
                self.stdout.write(f"  [OK]   {canonical_id} ({name}) — already correct")
                continue

            # --- Has old PK-based ID that needs migrating ---
            if old_style_id in existing:
                old_cat = existing[old_style_id]
                self.stdout.write(
                    f"  [FIX]  Rename {old_style_id!r} → {canonical_id!r} ({name})"
                )
                if not dry_run:
                    self._rename_category(old_cat, canonical_id, name, description, merchant)
                continue

            # --- Check any other non-canonical IDs matching this name ---
            name_match = Category.objects.filter(merchant=merchant, name=name).exclude(id=canonical_id).first()
            if name_match:
                self.stdout.write(
                    f"  [FIX]  Rename {name_match.id!r} → {canonical_id!r} ({name})"
                )
                if not dry_run:
                    self._rename_category(name_match, canonical_id, name, description, merchant)
                continue

            # --- Missing entirely — create it ---
            self.stdout.write(f"  [NEW]  Create {canonical_id!r} ({name})")
            if not dry_run:
                Category.objects.create(
                    id=canonical_id,
                    merchant=merchant,
                    name=name,
                    description=description,
                    slug=slug,
                )

    def _rename_category(self, old_cat, new_id, name, description, merchant):
        """
        Django doesn't allow in-place PK changes on CharField primary keys.
        Strategy:
          1. Create the new category with the canonical ID.
          2. Re-point all products from the old category to the new one.
          3. Delete the old category.
        """
        # Step 1 — create new
        new_cat, _ = Category.objects.get_or_create(
            id=new_id,
            merchant=merchant,
            defaults={
                "name": name,
                "description": description or old_cat.description,
                "slug": slugify(name),
            },
        )

        # Step 2 — migrate products
        affected = Product.objects.filter(category=old_cat)
        count = affected.count()
        if count:
            affected.update(category=new_cat)
            self.stdout.write(f"         Moved {count} product(s) to {new_id!r}")

        # Step 3 — delete old
        old_cat.delete()
        self.stdout.write(f"         Deleted old category {old_cat.id!r}")
