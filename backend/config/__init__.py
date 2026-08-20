from .celery import app as celery_app

# Python 3.14 compatibility patch for Django Template BaseContext copy
try:
    from django.template import context as _ctx
    def _compat_basecontext_copy(self):
        duplicate = object.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate
    _ctx.BaseContext.__copy__ = _compat_basecontext_copy
except Exception:
    pass

__all__ = ("celery_app",)
