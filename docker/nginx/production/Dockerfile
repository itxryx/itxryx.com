FROM nginx:stable-bookworm

RUN rm -f /etc/nginx/conf.d/*

ADD /docker/nginx/production/nginx.conf /etc/nginx/nginx.conf
ADD /docker/nginx/production/app.conf /etc/nginx/conf.d/app.conf

CMD /usr/sbin/nginx -g 'daemon off;' -c /etc/nginx/nginx.conf
