FROM node:22-alpine

# Set PNPM store location
ENV PNPM_HOME=/root/.pnpm
ENV PATH=$PNPM_HOME:$PATH

# Enable corepack
RUN corepack enable

# Start installing NVM & PNPM
RUN mkdir -p /app

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-optional --reporter=append-only

# Copy all other files
COPY . .

EXPOSE 3001

CMD [ "pnpm", "run", "dev" ]
