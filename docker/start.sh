#!/usr/bin/env bash

set -e

PORT_TO_USE="${PORT:-8080}"
sed -i "s/listen 8080;/listen ${PORT_TO_USE};/g" /etc/nginx/http.d/default.conf

echo "Allowing PHP-FPM to read Railway environment variables..."
sed -i 's/^;*clear_env = .*/clear_env = no/' /usr/local/etc/php-fpm.d/www.conf || true
grep -q "^clear_env = no" /usr/local/etc/php-fpm.d/www.conf || echo "clear_env = no" >> /usr/local/etc/php-fpm.d/www.conf

echo "Fixing Laravel storage permissions..."
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
touch storage/logs/laravel.log
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

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
