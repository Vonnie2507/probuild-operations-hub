FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for prisma)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Expose port
EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
