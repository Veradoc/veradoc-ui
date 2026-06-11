#!/bin/sh

# Substitute env vars into env.js at container startup
envsubst '${API_URL} ${WS_URL}' \
  < /usr/share/nginx/html/env.js.template \
  > /usr/share/nginx/html/env.js

echo "VeraDoc UI starting with:"
echo "  API_URL = ${API_URL}"
echo "  WS_URL  = ${WS_URL}"

exec nginx -g 'daemon off;'