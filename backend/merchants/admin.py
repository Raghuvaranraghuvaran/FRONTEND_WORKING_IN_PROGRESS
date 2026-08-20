from django.contrib import admin

from .models import Merchant, MerchantProfile

admin.site.register(Merchant)
admin.site.register(MerchantProfile)
