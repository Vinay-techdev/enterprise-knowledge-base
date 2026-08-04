FROM node:22.18.0-alpine AS production

LABEL maintainer="Vinay"
LABEL project="Enterprise Knowledge Base"
LABEL version="1.0"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server.js"]