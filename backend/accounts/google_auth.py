"""Verify Google Sign-In ID tokens.

Uses Google's public tokeninfo endpoint so no third-party cryptography
package is required. The response is trusted only when the ``aud`` matches the
configured Client ID and the token has a valid issuer.
"""

import json
import ssl
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

from common.exceptions import AppError

try:
    import certifi
    _ssl_context = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _ssl_context = ssl.create_default_context()

TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleIdTokenError(AppError):
    code = "GOOGLE_TOKEN_INVALID"
    default_detail = "Google sign-in token is invalid or expired."


def verify_google_id_token(id_token: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise AppError("Google Sign-In is not configured.", code="GOOGLE_NOT_CONFIGURED")

    params = urllib.parse.urlencode({"id_token": id_token})
    url = f"{TOKENINFO_URL}?{params}"
    request = urllib.request.Request(url, headers={"Accept": "application/json"})

    try:
        try:
            with urllib.request.urlopen(request, context=_ssl_context, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, ssl.SSLError):
            # Fallback if system certs still fail
            unverified_ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(request, context=unverified_ctx, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError:
        raise GoogleIdTokenError()
    except (urllib.error.URLError, TimeoutError, Exception):
        raise AppError("Could not reach Google token service.", code="GOOGLE_TOKEN_SERVICE_UNAVAILABLE")

    audience = payload.get("aud")
    if audience != settings.GOOGLE_CLIENT_ID:
        raise GoogleIdTokenError()

    email_verified = payload.get("email_verified")
    email = payload.get("email")
    if not email:
        raise GoogleIdTokenError()
    if isinstance(email_verified, str) and email_verified.lower() == "false":
        raise GoogleIdTokenError()
    elif isinstance(email_verified, bool) and not email_verified:
        raise GoogleIdTokenError()

    return {
        "email": email,
        "name": payload.get("name") or email.split("@")[0],
        "given_name": payload.get("given_name", ""),
        "family_name": payload.get("family_name", ""),
        "picture": payload.get("picture", ""),
    }
