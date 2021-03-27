FROM buildkite/puppeteer

WORKDIR /usr/app

COPY package.json .

RUN yarn install 

COPY . .

CMD ["./start.sh"]