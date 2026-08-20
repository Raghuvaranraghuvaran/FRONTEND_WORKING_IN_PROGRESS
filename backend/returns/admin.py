from django.contrib import admin

from .models import DoorstepProof, ReturnEvent, ReturnLine, ReturnRequest, ReviewDecision

admin.site.register(ReturnRequest)
admin.site.register(ReturnLine)
admin.site.register(ReturnEvent)
admin.site.register(DoorstepProof)
admin.site.register(ReviewDecision)
