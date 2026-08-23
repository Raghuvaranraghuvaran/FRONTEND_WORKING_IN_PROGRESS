# Quick Start - Payment System

## Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

## Run Database Migrations
```bash
python manage.py migrate
```

## Start Services (3 Terminals)

### Terminal 1 - Redis
```bash
# Windows (download from https://github.com/microsoftarchive/redis/releases)
redis-server

# Or if installed via chocolatey:
redis-server
```

### Terminal 2 - Celery Worker
```bash
cd backend
celery -A config worker --loglevel=info --pool=solo
```

### Terminal 3 - Django Server
```bash
cd backend
python manage.py runserver
```

## Test Email (Optional)
For testing, use console email backend in `.env`:
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Emails will print to console instead of sending.

## Check Celery is Working
```bash
# In Django shell
python manage.py shell

from invoices.tasks import generate_and_send_invoice
# This should print task info
```

## Current Status
✅ Models enhanced
✅ Migrations applied
✅ Celery configured
✅ PDF generator ready
✅ Tasks created
✅ Payment service ready

🔧 Next: Update checkout API and create frontend UI
