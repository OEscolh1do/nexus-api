FROM node:18

WORKDIR /app

COPY package*.json ./

RUN apt-get update -y && apt-get install -y openssl

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
