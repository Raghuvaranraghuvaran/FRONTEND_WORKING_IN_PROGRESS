from rest_framework.permissions import BasePermission

from .tenancy import get_merchant_from_user


class IsMerchantAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_merchant_admin", False))


class IsShopper(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_shopper", False))


class IsMerchantOwner(BasePermission):
    """Grant access only when the merchant context belongs to this user."""

    def has_object_permission(self, request, view, obj):
        merchant = get_merchant_from_user(request.user)
        if merchant is None:
            return False
        obj_merchant = getattr(obj, "merchant", None)
        if obj_merchant is None:
            obj_merchant = getattr(obj, "merchant_id", None)
        return obj_merchant is not None and obj_merchant == merchant.id or obj_merchant == merchant
