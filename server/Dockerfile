# Use Node.js 18 for compatibility
FROM node:18-bullseye-slim

# Set working directory to the server directory
WORKDIR /usr/src/app/server

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and TypeScript config from server directory
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to dist folder
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

# Set environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048"

# Start the compiled application
CMD ["node", "dist/index.js"]