# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Nuxt application
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

# Variables de entorno fundamentales para producción en Nuxt/Nitro
ENV NODE_ENV=production
ENV HOST=0.0.0.0

WORKDIR /app

# Copy the built Nuxt output
COPY --from=builder /app/.output ./.output

# Seguridad: Asignar permisos y cambiar a usuario no administrador
RUN chown -R node:node /app
USER node

# Render asigna el puerto automáticamente
EXPOSE ${PORT:-3000}

# Start the Nuxt server
CMD ["node", ".output/server/index.mjs"]
