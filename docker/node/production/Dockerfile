FROM node:22-bookworm-slim

RUN apt update -qq && \
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

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
EXPOSE $PORT
