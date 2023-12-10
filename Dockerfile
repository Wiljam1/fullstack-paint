

WORKDIR /app

COPY . .

WORKDIR /app

RUN npm install --legacy-peer-deps

EXPOSE 3001

CMD ["node", "server.js"]