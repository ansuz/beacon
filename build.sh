#!/bin/bash

# compile all your js
browserify -t strictify ./src/js/main.js > ./www/bundle.js;

# compile less into css
lessc ./src/styles/main.less --clean-css="--s1 --advanced --compatibility=ie8" > ./www/stylesheet.css;

# copy favicon to www
cp ./src/favicon.png ./www/favicon.png
cp ./src/favicon-alt.png ./www/favicon-alt.png

# take a hash of that file
hash="sha384-$(cat ./www/bundle.js | openssl dgst -sha384 -binary | openssl enc -base64 -A)";

# sed your script resource integrity into a page
content="$(sed -e "s|{SRI}|$hash|g" ./src/template.html)";

# overwrite your existing content
echo $content > ./www/index.html

