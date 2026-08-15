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

WORKDIR /app

# Copy the built Nuxt output
COPY --from=builder /app/.output ./.output

# Railway provides PORT automatically; Nuxt/Nitro reads HOST and PORT
ENV HOST=0.0.0.0
EXPOSE ${PORT:-3000}

# Start the Nuxt server
CMD ["node", ".output/server/index.mjs"]
