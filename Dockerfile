FROM node:10

COPY . .

RUN npm install

EXPOSE 5000

CMD [ "node", "index.js" ]