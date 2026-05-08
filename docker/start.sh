#!/usr/bin/env bash

set -e

PORT_TO_USE="${PORT:-8080}"
sed -i "s/listen 8080;/listen ${PORT_TO_USE};/g" /etc/nginx/http.d/default.conf

php artisan config:clear
php artisan route:clear
php artisan view:clear

php artisan migrate --force
php artisan storage:link || true
php artisan optimize

php-fpm -D
nginx -g "daemon off;"

