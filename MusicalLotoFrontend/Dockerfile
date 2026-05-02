FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine AS final

COPY --from=build /app/dist /usr/share/nginx/html

RUN echo "server { \
    listen 80; \
    client_max_body_size 100m; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files \$uri \$uri/ /index.html; \
    } \
    location ~* \\.html\$ { \
        root /usr/share/nginx/html; \
        add_header Cache-Control \"no-cache, no-store, must-revalidate\"; \
        add_header Pragma \"no-cache\"; \
        add_header Expires 0; \
    } \
    location /api/ { \
        proxy_pass http://api:8080/api/; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
    } \
    location /audio/ { \
        proxy_pass http://api:8080/audio/; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
    } \
    location /images/ { \
        proxy_pass http://api:8080/images/; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
    } \
    location /gameHub/ { \
        proxy_pass http://api:8080/gameHub/; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade \$http_upgrade; \
        proxy_set_header Connection \"Upgrade\"; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
