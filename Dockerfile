FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Form endpoints are baked in at build time (see README).
ARG PUBLIC_APPOINTMENT_ENDPOINT=/api/appointment
ARG PUBLIC_CONTACT_ENDPOINT
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app
COPY server.ts ./
COPY --from=build /app/dist ./dist
USER bun
EXPOSE 3000
CMD ["bun", "server.ts"]
