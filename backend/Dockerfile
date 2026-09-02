# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Build the NestJS application
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

# Variables de entorno para producción
ENV NODE_ENV=production

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files and install production-only dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

# Re-generate Prisma client in production image (needs correct binary)
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory and change ownership to 'node' user
RUN mkdir -p uploads && chown -R node:node /app

# Switch to non-root user for security
USER node

# Render provides PORT automatically via environment variable
EXPOSE ${PORT:-3001}

# In Render, it's recommended to run migrations in the "Pre-Deploy Command" 
# via the Render Dashboard: npx prisma migrate deploy
# So here we just start the app
CMD ["node", "dist/main"]

