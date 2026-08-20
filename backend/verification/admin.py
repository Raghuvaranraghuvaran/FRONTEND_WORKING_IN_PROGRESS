from django.contrib import admin

from .models import OTPChallenge, VerificationEvent

admin.site.register(OTPChallenge)
admin.site.register(VerificationEvent)
