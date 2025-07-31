# Next.js用Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
# パッケージファイルのみコピーして依存解決をキャッシュ
COPY package*.json ./
RUN npm ci --only=production

# 開発用依存もインストールする場合（コメントアウトで切替）
# RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.jsをビルド
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# ポートを公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 本番起動
CMD ["npm", "start"]
# 開発用起動例（コメントアウトで切替）
# CMD ["npm", "run", "dev"]
