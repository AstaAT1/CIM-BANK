#!/usr/bin/env bash

set -e

PORT_TO_USE="${PORT:-8080}"

echo "Fixing Laravel storage permissions..."
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
touch storage/logs/laravel.log
chmod -R 777 storage bootstrap/cache

echo "Clearing Laravel caches..."
php artisan optimize:clear || true
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "Checking Laravel env..."
php artisan tinker --execute="echo 'DB=' . config('database.default') . PHP_EOL; echo 'HOST=' . config('database.connections.pgsql.host') . PHP_EOL;" || true

echo "Running migrations..."
php artisan migrate --force

echo "Seeding production demo data..."
php artisan db:seed --class=ProductionDemoSeeder --force || true

echo "Linking storage..."
php artisan storage:link || true

echo "Starting Laravel on port ${PORT_TO_USE}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT_TO_USE}"
