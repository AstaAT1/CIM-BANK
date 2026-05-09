FROM php:8.3-fpm-alpine

WORKDIR /var/www/html


    RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    curl-dev \
    git \
    unzip \
    nodejs \
    npm \
    postgresql-dev \
    sqlite-dev \
    libzip-dev \
    libpng-dev \
    icu-dev \
    oniguruma-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pdo_sqlite \
        mbstring \
        zip \
        bcmath \
        intl \
        gd \
        pcntl \
        curl \
        exif

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi \
    && npm run build

RUN chown -R www-data:www-data storage bootstrap/cache public \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/start.sh /start.sh

RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
