FROM node:12.17.0-alpine
WORKDIR /onlab
COPY package.json ./
COPY package-lock.json ./
COPY .env ./
COPY tsconfig.json ./
COPY src ./src
RUN ls -a
RUN npm install
RUN npm run build
CMD ["npm", "run start"]
## this is stage two , where the app actually runs
# FROM node:12.17.0-alpine
# WORKDIR /onlab
# COPY package.json ./
# COPY package-lock.json ./
# RUN npm install --only=production
# COPY --from=0 /onlab/dist .
# RUN npm install pm2 -g
# CMD ["pm2-runtime","index.js"]