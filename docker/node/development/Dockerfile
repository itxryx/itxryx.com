FROM node:22-bookworm-slim

RUN apt update && \
    apt -y install build-essential && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir /itxryx-com
WORKDIR /itxryx-com
COPY . /itxryx-com
COPY /package.json /itxryx-com/package.json
COPY /package-lock.json /itxryx-com/package-lock.json

RUN npm install
RUN npm run build
