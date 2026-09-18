FROM node:24-bookworm-slim AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_PUBLIC_PATH=/Switzerland/
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4318 PUBLIC_BASE_PATH=/Switzerland PUBLIC_ORIGIN=https://midnight.vote
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node server/ ./server/
COPY --chown=node:node deploy/switzerland/bootstrap.mjs ./bootstrap.mjs
COPY --from=build --chown=node:node /app/frontend/dist/client/ ./frontend/dist/client/
RUN mkdir -p data && chown node:node data
USER node
EXPOSE 4318
CMD ["node", "server/index.mjs"]
