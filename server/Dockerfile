# Use Node.js LTS image
FROM node:22

# Set working directory
WORKDIR /usr/src/server

# Copy package.json and package-lock.json
COPY ./server/package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY ./server .

# Expose port
EXPOSE 5500

# Start the server
CMD ["npm", "run", "live"]
