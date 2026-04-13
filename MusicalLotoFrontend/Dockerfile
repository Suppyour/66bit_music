# --- Этап 1: Сборка (Build) React/Vite ---
FROM node:20-alpine AS build
WORKDIR /app

# Копируем файлы конфигурации NPM
COPY package.json package-lock.json ./
# Устанавливаем зависимости чисто
RUN npm ci

# Копируем остальной код фронтенда
COPY . .
# Запускаем сборку (Vite создаст папку dist внутри образа)
RUN npm run build


# --- Этап 2: Раздача статики через легковесный шлюз ---
FROM nginx:alpine AS final

# Копируем готовые HTML/JS/CSS из предыдущего слоя
COPY --from=build /app/dist /usr/share/nginx/html

# Записываем правильный конфиг Nginx 
# (try_files нужен для того, чтобы React-роутер работал при прямом переходе по ссылке, а не выдавал 404)
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
