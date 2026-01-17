# ============================================
# SmartFactory CONNECT - Backend API Server
# ============================================
# Node.js 18 LTS with Alpine for minimal footprint
# Optimized for production deployment
# Aligned with SRS v2.1
# ============================================

FROM node:18-alpine

# Install required system dependencies
RUN apk add --no-cache \
    wget \
    curl \
    dumb-init

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Create necessary directories
RUN mkdir -p uploads/incidents uploads/ideas uploads/news uploads/avatars uploads/temp logs

# Set proper permissions
RUN chown -R node:node /app

# Use non-root user for security
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "index.js"]
