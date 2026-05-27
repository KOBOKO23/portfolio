#!/bin/bash
# Quick start script for the portfolio Django backend
set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it to add your OPENWEATHER_API_KEY"
fi

python manage.py migrate
python manage.py runserver
