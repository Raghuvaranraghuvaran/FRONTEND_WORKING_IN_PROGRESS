from rest_framework.response import Response


def success(data=None, meta=None, status=None):
    """Wrap a response in the documented `{data, meta}` envelope."""
    payload = {"data": data}
    if meta:
        payload["meta"] = meta
    if status is None:
        return Response(payload)
    return Response(payload, status=status)


def request_id_meta(request, extra=None):
    meta = {"request_id": getattr(request, "request_id", None)}
    if extra:
        meta.update(extra)
    return meta
