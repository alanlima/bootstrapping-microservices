ARG version=12.18.1-alpine

FROM node:${version}

WORKDIR /usr/src/app
COPY package*.json ./
# RUN npm install --only=production
# COPY ./src ./src

CMD npm config set cache-min 99999 && \
    npm install && \
    npm run start:dev

# CMD npm start