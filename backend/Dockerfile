# Use official Node.js LTS image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (default: 4000)
EXPOSE 4000

# Set environment variables (override as needed)
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/server.js"]
