FROM node:20.9.0-alpine as base

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache --virtual .build-deps \
    g++ make python3 py3-pip \
    && npm install --arch=x64 --platform=linuxmusl sharp \
    && npm ci \
    && apk del .build-deps

COPY . .

EXPOSE 3001

# Run the application
CMD ["node", "server.js"]

#CMD ["npm", "start"]