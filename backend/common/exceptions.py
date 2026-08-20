from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler


class AppError(APIException):
    """Base application error carrying a stable machine-readable code."""

    status_code = status.HTTP_400_BAD_REQUEST
    code = "APPLICATION_ERROR"
    default_detail = "The request could not be completed."

    def __init__(self, detail=None, code=None, field_errors=None):
        if code is not None:
            self.code = code
        if detail is None:
            detail = self.default_detail
        super().__init__(detail=detail)
        self.field_errors = field_errors or {}


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"


class PaymentSignatureInvalid(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "PAYMENT_SIGNATURE_INVALID"
    default_detail = "Webhook signature verification failed."


class ReturnNotEligible(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "RETURN_NOT_ELIGIBLE"
    default_detail = "This order cannot be returned."


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get("request")
    request_id = getattr(request, "request_id", None)

    if response is not None:
        data = response.data
        if isinstance(data, dict) and "detail" in data and "error" not in data:
            payload = {
                "error": {
                    "code": getattr(exc, "code", exc.__class__.__name__.upper()),
                    "message": str(data.get("detail")),
                    "field_errors": data.get("field_errors", {}),
                    "request_id": request_id,
                }
            }
            response.data = payload
        elif isinstance(exc, ValidationError) and isinstance(data, dict):
            payload = {
                "error": {
                    "code": getattr(exc, "code", "VALIDATION_ERROR"),
                    "message": "Validation failed.",
                    "field_errors": data,
                    "request_id": request_id,
                }
            }
            response.data = payload
        elif isinstance(exc, DjangoPermissionDenied) or response.status_code == status.HTTP_403_FORBIDDEN:
            payload = {
                "error": {
                    "code": "PERMISSION_DENIED",
                    "message": str(getattr(exc, "detail", "Permission denied.")),
                    "field_errors": {},
                    "request_id": request_id,
                }
            }
            response.data = payload
        elif isinstance(exc, Http404) or response.status_code == status.HTTP_404_NOT_FOUND:
            payload = {
                "error": {
                    "code": "NOT_FOUND",
                    "message": "The requested resource was not found.",
                    "field_errors": {},
                    "request_id": request_id,
                }
            }
            response.data = payload
    else:
        if isinstance(exc, AppError):
            payload = {
                "error": {
                    "code": exc.code,
                    "message": str(exc.detail),
                    "field_errors": exc.field_errors,
                    "request_id": request_id,
                }
            }
            from rest_framework.response import Response

            response = Response(payload, status=exc.status_code)

    return response
