FROM node:24.22.1-bookworm-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund
COPY server ./server
COPY ui ./ui
RUN mkdir -p /data && chown node:node /data
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4718 DATA_DIR=/data
EXPOSE 4718
CMD ["node", "server/index.mjs"]
