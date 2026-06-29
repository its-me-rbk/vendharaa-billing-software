FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Ensure the logs folder exists
RUN mkdir -p logs

EXPOSE 1007

CMD ["node", "server.js"]
