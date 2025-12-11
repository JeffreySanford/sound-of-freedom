FROM node:22.8.0-alpine3.18
WORKDIR /app
COPY mock-server.js /app/mock-server.js
RUN npm init -y && npm install express body-parser cors
EXPOSE 11434
CMD ["node", "./mock-server.js"]
