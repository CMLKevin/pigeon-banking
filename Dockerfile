# Multi-stage Dockerfile for PhantomPay
# Builds frontend and runs backend in production

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY client/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies only
WORKDIR /app/server
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/client/dist /app/client/dist

# Create data directory for SQLite database
RUN mkdir -p /data && \
    ln -sf /data/database.db /app/server/database.db

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]

