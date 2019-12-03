FROM node:10-alpine

ENV NODE_ENV=production
COPY ./package*.json ./
RUN npm i --production

COPY . .

EXPOSE 8080

CMD [ "node", "index.js" ]
