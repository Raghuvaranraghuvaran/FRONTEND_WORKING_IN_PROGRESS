from .models import AuditLog


def log_action(*, merchant, actor, action, target, notes=""):
    return AuditLog.objects.create(
        merchant=merchant,
        actor=actor,
        action=action,
        target=target,
        notes=notes,
    )
