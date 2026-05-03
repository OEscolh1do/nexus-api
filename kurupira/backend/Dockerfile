FROM node:20-slim

# Instalar OpenSSL necessário para o Prisma no Debian slim
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate

ENV PORT=3005
EXPOSE 3005

# Health check endpoint
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]
