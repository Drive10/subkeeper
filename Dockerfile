FROM node:20-slim AS backend-builder

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN rm -rf dist
RUN npm run build

FROM node:20-slim AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV CI=true DISABLE_ESLINT_PLUGIN=true
RUN npm run build

FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY --from=frontend-builder /frontend/build ./frontend/build

EXPOSE 3000

CMD ["node", "dist/index.js"]
