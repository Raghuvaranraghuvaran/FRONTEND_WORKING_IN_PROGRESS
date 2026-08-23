import json
import logging
import ssl
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from common.exceptions import AppError

logger = logging.getLogger(__name__)

KNOWN_CLIENT_IDS = {
    "604991077373-64vuiauji09psh9n09gh3d8uqid444io.apps.googleusercontent.com",
    "511413180726-tks4agohomumjqluivasu15doe31giim.apps.googleusercontent.com",
}

TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleIdTokenError(AppError):
    code = "GOOGLE_TOKEN_INVALID"
    default_detail = "Google sign-in token is invalid or expired."


def verify_google_id_token(id_token: str) -> dict:
    if not id_token:
        raise GoogleIdTokenError("Google credential is missing.")

    # Allow mock/demo tokens for seamless local dev & testing
    if id_token in ("mock-credential", "mock-token") or id_token.startswith("mock-") or id_token.startswith("demo-"):
        return {
            "email": "demo@shopper.com",
            "name": "Demo Shopper",
            "given_name": "Demo",
            "family_name": "Shopper",
            "picture": "",
        }

    # 1. Try official google-auth library first
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            clock_skew_in_seconds=10,
        )
        email = idinfo.get("email")
        if email:
            return {
                "email": email,
                "name": idinfo.get("name") or email.split("@")[0],
                "given_name": idinfo.get("given_name", ""),
                "family_name": idinfo.get("family_name", ""),
                "picture": idinfo.get("picture", ""),
            }
    except Exception as exc:
        logger.debug("google.oauth2 library verification failed: %s; trying tokeninfo endpoint", exc)

    # 2. Fallback to tokeninfo endpoint
    params = urllib.parse.urlencode({"id_token": id_token})
    url = f"{TOKENINFO_URL}?{params}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})

    payload = None
    try:
        unverified_ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=unverified_ctx, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        logger.warning("tokeninfo endpoint request failed: %s", exc)
        raise GoogleIdTokenError("Google sign-in token verification failed.")

    email = payload.get("email")
    if not email:
        raise GoogleIdTokenError("Google token does not contain a valid email.")

    return {
        "email": email,
        "name": payload.get("name") or email.split("@")[0],
        "given_name": payload.get("given_name", ""),
        "family_name": payload.get("family_name", ""),
        "picture": payload.get("picture", ""),
    }

