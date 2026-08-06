# syntax=docker/dockerfile:1

FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader

FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY vite.config.* ./
COPY postcss.config.* tailwind.config.* ./
COPY resources ./resources
COPY public ./public
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY routes ./routes

RUN npm run build

FROM php:8.3-cli-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache \
    bash \
    curl \
    freetype-dev \
    icu-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    zip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install bcmath exif gd intl mbstring pdo_mysql zip opcache

COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-lc", "php artisan serve --host 0.0.0.0 --port ${PORT:-10000}"]