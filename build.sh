#!/usr/bin/env bash
# build.sh - Render.com build script
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Skip migrations during build - they'll run on startup
echo "Skipping migrations during build (will run on startup)"