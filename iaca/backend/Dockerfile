FROM node:20-slim

# Instalar OpenSSL necessário para o Prisma no Debian slim
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate

EXPOSE 3001

# Health check endpoint
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]
