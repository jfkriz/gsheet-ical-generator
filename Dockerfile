FROM node:12.16.3-slim

# Create app directory
WORKDIR /usr/src/app

# I like using less on log files
# RUN apt-get install less

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY ./dist .env* ./

# I want dates in logs to show up in my timezone...
ENV TZ=America/New_York

# Expose port 8080 (should match the app port)
EXPOSE 3000

CMD [ "node", "app.js" ]
