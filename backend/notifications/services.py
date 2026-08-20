from .models import InAppNotification


def create_notification(*, user, type_, title, body="", channel="in_app"):
    return InAppNotification.objects.create(
        user=user,
        type=type_,
        title=title,
        body=body,
        channel=channel,
    )
