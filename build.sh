#!/bin/bash
set -e

npm --prefix sliitui run build
python3 -m venv .vercel-build-venv
. .vercel-build-venv/bin/activate
pip install -r requirements.txt
python backend/manage.py migrate --noinput --settings=config.settings.production
python backend/manage.py collectstatic --noinput --settings=config.settings.production