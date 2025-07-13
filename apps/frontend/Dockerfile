FROM node:22-alpine AS base

# Enable corepack
RUN corepack enable
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY . /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Copy all files to app directory
WORKDIR /app
COPY . /app

# Install all dependencies and build everything.
RUN echo $API_URL > /app/build.log
RUN pnpm install --frozen-lockfile
RUN pnpm build >> /app/build.log

FROM base
WORKDIR /app

# Copy all files from the stages before
COPY --from=deps  /app/package.json /app/package.json
COPY --from=deps  /app/node_modules /app/node_modules
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public

COPY --from=build /app/build.log /app/build.log

EXPOSE 3000

# Run
CMD [ "pnpm", "start" ]
