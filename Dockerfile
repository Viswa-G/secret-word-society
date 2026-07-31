FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
CMD ["node", ".output/server/index.mjs"]
