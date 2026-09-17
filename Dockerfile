FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY server/ ./server/
COPY --from=frontend /build/frontend/dist/client ./frontend/dist/client
RUN mkdir -p /app/data && chown -R node:node /app
USER node
ENV HOST=0.0.0.0 PORT=4318
EXPOSE 4318
CMD ["node", "server/index.mjs"]
