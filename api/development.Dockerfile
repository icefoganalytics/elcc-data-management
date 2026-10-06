FROM node:22.20.0-alpine3.22

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm clean-install

COPY bin/boot-app.sh ./bin/
RUN chmod +x ./bin/boot-app.sh

CMD ["/usr/src/api/bin/boot-app.sh"]
