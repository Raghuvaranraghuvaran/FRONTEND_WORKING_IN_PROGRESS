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
    merchant they are registered against.
    """
    merchant_profile = getattr(user, "merchant_profile", None)
    if merchant_profile is not None:
        return merchant_profile.merchant
    shopper = getattr(user, "shopper_profile", None)
    if shopper is not None and shopper.merchant_id:
        return shopper.merchant
    from merchants.models import Merchant
    return Merchant.objects.first()


def require_merchant_context(request):
    merchant = get_merchant_from_user(request.user)
    if merchant is None:
        raise PermissionDenied("Merchant context could not be resolved.")
    return merchant
