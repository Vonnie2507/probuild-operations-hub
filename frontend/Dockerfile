FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set the API URL at build time
ARG VITE_API_URL=https://probuild-operations-hub-production.up.railway.app/api
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# Production stage - serve with a simple node server
FROM node:20-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

# Railway uses PORT env variable
ENV PORT=3000
EXPOSE 3000

# Serve the app
CMD ["sh", "-c", "serve -s dist -l $PORT"]
