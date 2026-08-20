# ReturnGuard Backend

Django + Django REST Framework backend implementing the ReturnGuard fraud-detection
commerce platform. This project follows the architecture blueprint in
`../backend RG.pdf`: a multi-tenant commerce API with mock-first payments,
webhook-verified payment state, automated invoices/notifications, a composite
fraud engine, OTP verification, return workflows, and merchant operations.

## Stack

- Django + Django REST Framework
- PostgreSQL (psycopg 3)
- SimpleJWT for authentication
- Celery + Redis for background work (invoices, notifications)
- Multi-tenant security via merchant context + queryset scoping

## Quick start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo          # optional demo merchant/catalog data
python manage.py runserver
```

The API is served under `/api/`.

## Applications

| App | Responsibility |
| --- | --- |
| `config` | settings, root URL routing, middleware, Celery app |
| `common` | tenancy, permissions, exceptions, pagination, response envelope |
| `accounts` | custom user, addresses, shopper profile |
| `merchants` | merchant tenant + merchant admin |
| `catalog` | categories, products |
| `orders` | orders, order items, checkout service |
| `payments` | payment records, events, mock gateway, webhook verification |
| `invoices` | invoice generation + storage |
| `notifications` | email/in-app delivery records |
| `returns` | return requests, lines, timeline, doorstep proof |
| `fraud` | risk engine, signal extractors, decision engine |
| `verification` | OTP send/verify + verification events |
| `audit` | immutable audit log |
| `admin_api` | merchant dashboard, customers, flagged cases, review actions |
| `analytics` | aggregated trends and category return rates |

## Security contract

The gateway's signed webhook is the single source of truth for payment state.
The API never marks a payment `PAID` from a frontend message alone.
