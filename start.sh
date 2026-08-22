#!/usr/bin/env bash
set -e
if [ -d "backend" ]; then
  cd backend
fi
gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
