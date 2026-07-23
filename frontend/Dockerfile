# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose port 4004
EXPOSE 4004

# Use vite preview to serve built files on port 4004
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4004"]
