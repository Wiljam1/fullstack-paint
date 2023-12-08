ARG NODE_VERSION=20.9.0


FROM node:${NODE_VERSION}-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app

USER root
COPY . .

EXPOSE 3001
CMD node server.js