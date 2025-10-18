# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# production stage - serve with nginx
FROM nginx:alpine
# Vite builds to /app/dist by default
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config to enable SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf
# opcional: copia un nginx.conf custom si lo necesitas
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]