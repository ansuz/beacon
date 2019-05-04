var routes = module.exports;
routes[undefined] = routes.about = require("./about").route;
routes.dicebag = require("./dicebag").route;
routes.whoami = require("./whoami").route;
routes.four04 = require("./four04").route;


