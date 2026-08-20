import hashlib
import hmac

from django.conf import settings


class MockPaymentGateway:
    """Mock gateway with a signed webhook.

    The signature lets the API verify that a payment outcome actually came
    from the gateway, not from a forged frontend message. Swap this adapter
    for a real provider in Phase 3 without changing the webhook contract.
    """

    name = "mock"

    def verify_signature(self, payload: dict, signature: str) -> bool:
        expected = self.sign(payload)
        return hmac.compare_digest(expected, signature)

    def sign(self, payload: dict) -> str:
        canonical = "|".join(
            f"{k}={payload.get(k, '')}" for k in sorted(payload.keys()) if k != "signature"
        )
        return hmac.new(
            settings.PAYMENT_GATEWAY_SECRET.encode(),
            canonical.encode(),
            hashlib.sha256,
        ).hexdigest()


def get_gateway(name: str = "mock"):
    if name == "mock":
        return MockPaymentGateway()
    raise ValueError(f"Unknown gateway: {name}")
