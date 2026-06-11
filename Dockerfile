# Stage 1: Build the Angular app
FROM node:24-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the project (output goes to /app/dist/<project-name>)
RUN npm run build -- --configuration production

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to the Nginx html folder
# Replace 'veradoc-frontend' with your actual project name from angular.json
COPY --from=build /app/dist/veradoc-ui/browser /usr/share/nginx/html

# Copy a custom nginx config to handle Angular routing (optional but recommended)
#COPY nginx.conf /etc/nginx/conf.d/default.conf

#EXPOSE 80

#CMD ["nginx", "-g", "daemon off;"]

COPY docker/env.js.template /usr/share/nginx/html/env.js.template
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]