# Backend - Node.js API Server
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads/incidents uploads/ideas uploads/news uploads/temp logs

EXPOSE 3000

CMD ["node", "index.js"]
