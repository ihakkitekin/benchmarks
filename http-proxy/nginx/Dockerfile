FROM nginx:1.17.4-alpine

RUN apk add --update curl bash vim

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
COPY certs /etc/nginx/certs

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]