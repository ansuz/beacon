var routes = module.exports;
routes[undefined] = routes.about = require("./about").route;
routes.dicebag = require("./dicebag").route;
routes.settings = require("./settings").route;
routes.four04 = require("./four04").route;
routes.users = require("./users").route;


