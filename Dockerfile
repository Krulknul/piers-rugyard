# Use an official Node runtime as a parent image
FROM node:20

WORKDIR /app
COPY package*.json ./
# Install any needed packages specified in package.json
RUN npm install
RUN npm install -g rollup
# Copy the current directory contents into the container at /usr/src/app
COPY . .


RUN rollup -c

# Run the app when the container launches
CMD ["node", "dist/bundle.js"]
