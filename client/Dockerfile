# Use Node.js LTS image
FROM node:22

# Set working directory
WORKDIR /usr/src/client

# Copy package.json and package-lock.json
COPY ./client/package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY ./client ./

# Expose port
EXPOSE 3000

# Install http-server globally
RUN npm install -g http-server

# Start the server
CMD ["npm", "run", "start"]
