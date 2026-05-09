#!/usr/bin/env bash

set -e

PORT_TO_USE="${PORT:-8080}"
sed -i "s/listen 8080;/listen ${PORT_TO_USE};/g" /etc/nginx/http.d/default.conf

echo "Clearing Laravel caches..."
php artisan optimize:clear || true
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "Running migrations..."
php artisan migrate --force

echo "Linking storage..."
php artisan storage:link || true

echo "Starting PHP-FPM and Nginx..."
php-fpm -D
nginx -g "daemon off;"
