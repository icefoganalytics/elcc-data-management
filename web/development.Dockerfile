FROM node:22.20.0-alpine3.22

WORKDIR /usr/src/web

COPY package*.json ./

RUN npm clean-install

COPY . .

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
