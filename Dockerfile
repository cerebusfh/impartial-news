FROM node:22
RUN apt-get update && apt-get install -y git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
