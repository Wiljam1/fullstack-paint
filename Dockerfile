FROM node:20.9.0-alpine as base

WORKDIR /app

COPY package*.json ./

FROM base as dependencies

RUN apk add --no-cache --virtual .build-deps \
    g++ make python3 py3-pip \
    && npm install --arch=x64 --platform=linuxmusl sharp \
    && npm ci \
    && apk del .build-deps

# run tests
FROM dependencies as test

COPY . .
RUN npm test

FROM base as final

COPY --from=dependencies /app/node_modules /app/node_modules

COPY . .

EXPOSE 3001

# Run the application
CMD ["node", "server.js"]
