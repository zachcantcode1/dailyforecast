# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install pnpm for dependency management (optional, can use npm or yarn)
# RUN npm install -g pnpm

# Copy package.json and package-lock.json (or pnpm-lock.yaml, yarn.lock)
COPY package.json . 
# COPY package-lock.json . 

# Install dependencies
RUN npm install --omit=dev
# If you used pnpm: RUN pnpm install --prod
# If you used yarn: RUN yarn install --production

# Copy the rest of the application source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Create the production image
FROM node:20-slim

WORKDIR /usr/src/app

# Copy only necessary files from the builder stage
COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Expose any port your application might listen on (not strictly necessary for a cron job app)
# EXPOSE 3000 

# Set the environment variable for the webhook URL (can be overridden at runtime)
ENV WEBHOOK_URL="YOUR_WEBHOOK_URL_HERE"
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/index.js"]
