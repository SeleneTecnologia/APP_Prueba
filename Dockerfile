### STAGE 1: Build ###
FROM node:lts-alpine AS build
ARG environment
#### make the 'app' folder the current working directory
WORKDIR /usr/src/app
#### copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./
#### copy 'npm-shrinkwrap.json' (if available)
# COPY npm*.json ./
#### install angular cli
#RUN npm install -g @angular/cli
#### install project dependencies
RUN npm install --force
#### copy things
COPY . .
#### generate build --prod
RUN npm run $environment
### STAGE 2: Run ###
FROM nginxinc/nginx-unprivileged
#### copy nginx conf
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf
#### copy artifact build from the 'build environment'
COPY --from=build /usr/src/app/dist/frontend/browser /usr/share/nginx/html


#### don't know what this is, but seems cool and techy
CMD ["nginx", "-g", "daemon off;"]
