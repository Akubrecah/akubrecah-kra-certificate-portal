FROM node:20-slim

# Install dependencies for Playwright and system utilities
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    curl \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libnspr4 \
    libnss3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install full dependencies (including devDependencies required for Next.js and Prisma compilation)
RUN npm ci || npm install

# Copy application source code
COPY . .

# Install Playwright browser dependencies
RUN npx playwright install chromium --with-deps

# Provide build-time values so next build / prisma generate succeeds
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
ARG DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_Y2xlcmsuYWt1YnJlY2FoLmNvbSQ"
ARG CLERK_SECRET_KEY="dummy_build_key"

ENV DATABASE_URL=${DATABASE_URL}
ENV DIRECT_URL=${DIRECT_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}

# Generate Prisma client and build Next.js production bundle
RUN npx prisma generate
RUN npm run build

# Expose Next.js server port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
