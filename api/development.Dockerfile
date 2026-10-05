FROM node:22.20.0-alpine3.22

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm install && sha256sum package-lock.json > node_modules/.package-lock.sha256

COPY . .

RUN chmod +x ./bin/boot-app.sh

CMD ["/usr/src/api/bin/boot-app.sh"]
