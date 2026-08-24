from .models import AuditLog


def log_action(*, merchant, actor, action, target, notes="", customer=None, event_type="", metadata=None):
    return AuditLog.objects.create(
        merchant=merchant,
        customer=customer,
        actor=actor,
        action=action,
        event_type=event_type,
        target=target,
        notes=notes,
        metadata=metadata or {},
    )

