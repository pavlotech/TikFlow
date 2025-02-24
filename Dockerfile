# Use an Ubuntu base image
FROM ubuntu:22.04

# Set up environment variables for Bun
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Install dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    unzip \
    python3 \
    python3-distutils \
    build-essential \
    libc6-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Create and set working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies using Bun
RUN bun install

# Copy the entire project
COPY . .

# Generate Prisma client
RUN bun run prisma generate

# Create logs directory
RUN mkdir -p /logs

# Start the application
CMD ["bun", "run", "start"]

# Expose the port
EXPOSE 2222