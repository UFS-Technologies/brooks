FROM node:20-slim

WORKDIR /app/darlsco/src

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3520

CMD [ "npm", "start" ]
