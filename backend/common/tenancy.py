from django.core.exceptions import PermissionDenied


class TenantScopedManagerMixin:
    """Manager helper that scopes a queryset to the current merchant.

    Subclasses set ``merchant_field`` to the FK field name that references
    the merchant on the model. Accessing ``request.merchant`` is handled by
    middleware/factory callers instead of the manager itself, so this mixin
    stays framework-agnostic.
    """

    merchant_field = "merchant"


def get_merchant_from_user(user):
    """Resolve the merchant context for a user.

    Merchant admins resolve to their own merchant; shoppers resolve to the
    merchant they are registered against, or fallback to the primary store.
    """
    if user is None or not user.is_authenticated:
        return None

    merchant_profile = getattr(user, "merchant_profile", None)
    if merchant_profile is not None:
        return merchant_profile.merchant

    shopper = getattr(user, "shopper_profile", None)
    if shopper is not None and shopper.merchant_id:
        return shopper.merchant

    # If merchant admin has no profile yet, provision their isolated tenant
    if getattr(user, "is_merchant_admin", False) or getattr(user, "role", "") == "merchant_admin":
        from merchants.models import Merchant, MerchantProfile
        from django.utils.text import slugify
        base_slug = slugify(user.email.split("@")[0])[:35] or f"merchant-{user.id}"
        slug = base_slug
        counter = 1
        while Merchant.objects.filter(store_slug=slug).exclude(admin_email=user.email).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        merchant, _ = Merchant.objects.get_or_create(
            store_slug=slug,
            defaults={
                "business_name": f"{user.name or user.email.split('@')[0]}'s Store",
                "admin_email": user.email,
            },
        )
        MerchantProfile.objects.update_or_create(user=user, defaults={"merchant": merchant})
        return merchant

    # For shoppers, fallback to the default/primary store
    from merchants.models import Merchant
    merchant = Merchant.objects.filter(store_slug="aria-fashion-house").first() or Merchant.objects.first()
    if merchant is None:
        merchant = Merchant.objects.create(
            business_name="Aria Fashion House",
            store_slug="aria-fashion-house",
            admin_email="demo@merchant.com",
            merchant_username="ARIAFASHION4827",
        )

    if shopper is not None and shopper.merchant_id != merchant.id:
        try:
            shopper.merchant = merchant
            shopper.save(update_fields=["merchant"])
        except Exception:
            pass

    return merchant


def require_merchant_context(request):
    merchant = get_merchant_from_user(request.user)
    if merchant is None:
        from merchants.models import Merchant
        merchant = Merchant.objects.first()
    if merchant is None:
        raise PermissionDenied("Merchant context could not be resolved.")
    return merchant
