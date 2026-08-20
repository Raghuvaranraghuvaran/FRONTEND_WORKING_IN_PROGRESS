from django.contrib import admin

from .models import CustomerRiskProfile, FraudConfiguration, RiskScoreEvent

admin.site.register(FraudConfiguration)
admin.site.register(CustomerRiskProfile)
admin.site.register(RiskScoreEvent)
